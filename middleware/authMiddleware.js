const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id)
        .select('_id name email role isActive isDeleted');

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!user.isActive) {
        return res.status(403).json({ message: "User account is inactive" });
      }

      if (user.isDeleted) {
        return res.status(403).json({ message: "User account has been deleted" });
      }

      req.user = user;
      next();

    } catch (error) {
      return res.status(401).json({
        message: error.name === "TokenExpiredError" ? "Token expired" : "Invalid token"
      });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authorized, user missing"
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied for role: ${req.user.role}`
      });
    }

    next();
  };
};

module.exports = { protect, authorizeRoles };