const User = require('../models/User');
const bcrypt = require('bcryptjs');


// ➕ Create User (Admin only)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "viewer",
      isActive: true
    });

    user.password = undefined;

    res.status(201).json({
      message: "User created successfully",
      user
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Get All Users (Admin only)
// Get All Users (Admin only) — with pagination and search
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive
    } = req.query;

    let filter = { isDeleted: false };

    // Search by name or email
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      filter.role = role;
    }

    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const skip = (page - 1) * limit;

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// Get User By ID
const getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    // allow admin OR own profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// PUT - Full Update (Admin only)
const updateUser = async (req, res) => {
  try {
    const { name, password, role, isActive } = req.body || {};

    // Only admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Only admin can update users"
      });
    }

    // Prevent self update
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        message: "You cannot modify your own account"
      });
    }

    // Prevent email change
    if (req.body.email !== undefined) {
      return res.status(400).json({
        message: "Email cannot be updated once created"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    // Validate role
    const validRoles = ['viewer', 'analyst', 'admin'];
    if (role !== undefined && !validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Update fields safely
    if (name !== undefined) user.name = name;

    if (password !== undefined) {
      user.password = await bcrypt.hash(password, 10);
    }

    if (role !== undefined) user.role = role;

    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({
      message: "User updated successfully ",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// PATCH - Partial Update (Admin only)
const patchUser = async (req, res) => {
  try {
    const updates = req.body;

    // Only admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: "Access denied. Only admin can update users"
      });
    }

    // Prevent self update
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        message: "You cannot update your own account"
      });
    }

    // Prevent email change
    if (updates.email !== undefined) {
      return res.status(400).json({
        message: "Email cannot be updated once created"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const validRoles = ['viewer', 'analyst', 'admin'];

    // Allowed fields
    if (updates.name !== undefined) user.name = updates.name;

    if (updates.password !== undefined) {
      user.password = await bcrypt.hash(updates.password, 10);
    }

    if (updates.role !== undefined) {
      if (!validRoles.includes(updates.role)) {
        return res.status(400).json({
          message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
        });
      }
      user.role = updates.role;
    }

    if (updates.isActive !== undefined) user.isActive = updates.isActive;

    const updatedUser = await user.save();
    updatedUser.password = undefined;

    res.status(200).json({
      message: "User updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Delete User (Admin only)
const deleteUser = async (req, res) => {
  try {
    if (req.user._id.toString() === req.params.id) {
      return res.status(403).json({
        message: "You cannot delete your own account"
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isDeleted) {
      return res.status(400).json({ message: "User already deleted" });
    }

    user.isDeleted = true;
    user.isActive = false;
    await user.save();

    res.status(200).json({ message: "User deleted successfully ✅" });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  patchUser,
  deleteUser
};