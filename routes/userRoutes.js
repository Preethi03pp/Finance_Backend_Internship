const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  patchUser,
  deleteUser,
} = require('../controllers/userController');

//  Admin only routes
router.post('/', protect, authorizeRoles('admin'), createUser);
router.get('/', protect, authorizeRoles('admin'), getUsers);
router.get('/:id', protect, getUserById);
router.patch('/:id', protect, patchUser);
router.put('/:id', protect, authorizeRoles('admin'), updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;