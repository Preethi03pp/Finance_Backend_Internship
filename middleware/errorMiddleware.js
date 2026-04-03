const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // ✅ Handle MongoDB invalid ObjectId
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }

  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error"
  });
};

module.exports = errorHandler;