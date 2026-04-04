const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/profile', protect, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user
  });
});
router.get('/admin', protect, authorizeRoles('admin'), (req, res) => {
  res.json({
    message: "Welcome Admin"
  });
});
module.exports = router;