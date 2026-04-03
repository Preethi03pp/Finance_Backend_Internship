const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


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
      role: role || "user", // prevent misuse
      isActive: true
    });

    // hide password
    user.password = undefined;

    res.status(201).json({
      message: "User created successfully ✅",
      user
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// 🔐 Login User (MANDATORY)
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // check active status
    if (!user.isActive) {
      return res.status(403).json({ message: "User is deactivated" });
    }

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      "SECRET_KEY", // move to .env later
      { expiresIn: "7d" }
    );

    user.password = undefined;

    res.status(200).json({
      message: "Login successful ✅",
      token,
      user
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// 📄 Get All Users (Admin only)
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json(users);

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ✏️ Update User Role / Status
const updateUser = async (req, res) => {
  try {
    const { role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    const updatedUser = await user.save();

    updatedUser.password = undefined;

    res.status(200).json({
      message: "User updated successfully ✅",
      user: updatedUser
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// ❌ Delete User
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    await user.deleteOne();

    res.status(200).json({
      message: "User deleted successfully ✅"
    });

  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


module.exports = {
  createUser,
  loginUser,   // ✅ added
  getUsers,
  updateUser,
  deleteUser
};