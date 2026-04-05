const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { isValidObjectId } = require('../utils/validators'); // only need this one now

// ➕ Create User (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({
        success: false,
        code: 'DUPLICATE_ERROR',
        message: 'User with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'viewer',
      isActive: true
    });

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 📄 Get All Users (Admin only)
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, isActive } = req.query;

    let filter = { isDeleted: false };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 🔍 Get User By ID
const getUserById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid user ID format'
      });
    }

    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Access denied'
      });
    }

    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(200).json({ success: true, data: user });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ✏️ Full Update (PUT)
const updateUser = async (req, res) => {
  try {
    const { name, password, role, isActive } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid user ID format'
      });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot modify your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (name !== undefined) user.name = name.trim();
    if (password !== undefined) user.password = await bcrypt.hash(password, 10);
    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ✏️ Partial Update (PATCH)
const patchUser = async (req, res) => {
  try {
    const updates = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid user ID format'
      });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot update your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (updates.name !== undefined) user.name = updates.name.trim();
    if (updates.password !== undefined) user.password = await bcrypt.hash(updates.password, 10);
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = updates.isActive;

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ❌ Delete User (soft delete)
const deleteUser = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid user ID format'
      });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    if (user.isDeleted) {
      return res.status(400).json({
        success: false,
        code: 'ALREADY_DELETED',
        message: 'User is already deleted'
      });
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    res.status(200).json({ success: true, message: 'User deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ➕ Bulk Create Users (Admin only)
const bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'users must be a non-empty array'
      });
    }

    if (users.length > 50) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 50 users allowed per bulk request'
      });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < users.length; i++) {
      try {
        const { name, email, password, role } = users[i];

        // Validate each user
        if (!name || !email || !password) {
          errors.push({ index: i, error: 'name, email and password are required' });
          continue;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
          errors.push({ index: i, error: `Email ${email} already exists` });
          continue;
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
          name: name.trim(),
          email: email.toLowerCase(),
          password: hashedPassword,
          role: role || 'viewer',
          isActive: true
        });

        user.password = undefined;
        created.push(user);

      } catch (err) {
        errors.push({ index: i, error: err.message });
      }
    }

    res.status(errors.length === 0 ? 201 : 207).json({
      success: true,
      message: errors.length === 0
        ? 'All users created successfully'
        : 'Some users failed to create',
      data: {
        created_count: created.length,
        error_count: errors.length,
        created,
        errors
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// 🔒 Bulk Deactivate Users (Admin only)
const bulkDeactivateUsers = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'ids must be a non-empty array'
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 50 ids allowed per bulk request'
      });
    }

    // Validate all ids
    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: `Invalid IDs found: ${invalidIds.join(', ')}`
      });
    }

    // Prevent admin from deactivating themselves
    if (ids.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot deactivate your own account'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk deactivation completed',
      data: {
        matched: result.matchedCount,
        deactivated: result.modifiedCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// 🗑️ Bulk Delete Users (soft delete)
const bulkDeleteUsers = async (req, res) => {
  try {
    const { ids } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'ids must be a non-empty array'
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 50 ids allowed per bulk request'
      });
    }

    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: `Invalid IDs found: ${invalidIds.join(', ')}`
      });
    }

    if (ids.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot delete your own account'
      });
    }

    const result = await User.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { isDeleted: true, isActive: false }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk delete completed',
      data: {
        matched: result.matchedCount,
        deleted: result.modifiedCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// ✏️ Bulk Update Users
const bulkUpdateUsers = async (req, res) => {
  try {
    const { ids, updates } = req.body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'ids must be a non-empty array'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'updates object is required'
      });
    }

    if (ids.length > 50) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 50 ids allowed per bulk request'
      });
    }

    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: `Invalid IDs found: ${invalidIds.join(', ')}`
      });
    }

    if (ids.includes(req.user._id.toString())) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You cannot update your own account'
      });
    }

    // Only these fields allowed for bulk update
    const allowedFields = ['role', 'isActive'];
    const invalidFields = Object.keys(updates).filter(f => !allowedFields.includes(f));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FIELDS',
        message: `Cannot bulk update these fields: ${invalidFields.join(', ')}. Allowed: ${allowedFields.join(', ')}`
      });
    }

    if (updates.role && !['viewer', 'analyst', 'admin'].includes(updates.role)) {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Role must be viewer, analyst or admin'
      });
    }

    const allowedUpdates = {};
    if (updates.role !== undefined) allowedUpdates.role = updates.role;
    if (updates.isActive !== undefined) allowedUpdates.isActive = updates.isActive;

    const result = await User.updateMany(
      { _id: { $in: ids }, isDeleted: false },
      { $set: allowedUpdates }
    );

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      data: {
        matched: result.matchedCount,
        updated: result.modifiedCount
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

module.exports = { createUser, getUsers, getUserById, updateUser, patchUser, deleteUser, bulkCreateUsers, bulkDeactivateUsers, bulkDeleteUsers, bulkUpdateUsers  };