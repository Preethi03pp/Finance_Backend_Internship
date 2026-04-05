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

module.exports = { createUser, getUsers, getUserById, updateUser, patchUser, deleteUser };