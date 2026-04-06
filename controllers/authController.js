const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { isValidEmail } = require('../utils/validators');

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    const errors = {};
    if (!email) errors.email = 'Email is required';
    else if (!isValidEmail(email)) errors.email = 'Invalid email format';
    if (!password) errors.password = 'Password is required';

    if (Object.keys(errors).length > 0) {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_INACTIVE',
        message: 'Your account is inactive. Contact an admin.'
      });
    }

    if (user.isDeleted) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DELETED',
        message: 'This account has been deleted.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password'
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
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

// @desc Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};


module.exports = { loginUser, getMe };