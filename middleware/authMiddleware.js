const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  // check header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // get token
      token = req.headers.authorization.split(' ')[1];

      // verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user info to request
      req.user = decoded;

      next();
    } catch (error) {
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied: ${req.user.role} not allowed`
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };