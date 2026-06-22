function notFound(req, res, next) {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
