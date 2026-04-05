const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');                        
const { createUserValidation, updateUserValidation, patchUserValidation } = require('../validators/userValidator');

const {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  patchUser,
  deleteUser,
  bulkCreateUsers,
  bulkDeactivateUsers,
} = require('../controllers/userController');

router.post('/',     protect, authorizeRoles('admin'), createUserValidation,  validate, createUser);
router.get('/',      protect, authorizeRoles('admin'), getUsers);
router.post('/bulk', protect, authorizeRoles('admin'), bulkCreateUsers);
router.patch('/bulk/deactivate',protect, authorizeRoles('admin'), bulkDeactivateUsers);
router.get('/:id',   protect, getUserById);
router.patch('/:id', protect, authorizeRoles('admin'), patchUserValidation, validate, patchUser);
router.put('/:id',   protect, authorizeRoles('admin'), updateUserValidation, validate, updateUser);
router.delete('/:id', protect, authorizeRoles('admin'), deleteUser);

module.exports = router;