const jwt = require('jsonwebtoken');

// ✅ Protect middleware
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // get token
      token = req.headers.authorization.split(' ')[1];

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user info
      req.user = decoded;

      return next(); // ✅ IMPORTANT (stop further execution)
    } catch (error) {
      return res.status(401).json({
        message: "Not authorized, token failed"
      });
    }
  }

  return res.status(401).json({
    message: "Not authorized, no token"
  });
};

// ✅ Role-based middleware
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // 🔥 Extra safety check
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