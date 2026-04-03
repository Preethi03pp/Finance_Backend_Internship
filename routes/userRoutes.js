const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  createUser,
  getUsers,
  updateUser,
  deleteUser,
  loginUser
} = require('../controllers/userController');

// 🔐 Public route
router.post('/login', loginUser);

// 👨‍💼 Admin only routes
router.post('/', protect, authorizeRoles('admin'), createUser);
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.patch('/:id', protect, authorizeRoles('admin'), updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;