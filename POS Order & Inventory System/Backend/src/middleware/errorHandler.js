export const errorHandler = (error, req, res, next) => {
  console.error(error);
  const status = error.status || (error.name === 'ValidationError' ? 422 : error.code === 11000 ? 409 : 500);
  const code = error.code === 11000 ? 'DUPLICATE_RESOURCE' : error.name === 'ValidationError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR';
  res.status(status).json({ success: false, message: error.message || 'Internal server error', code });
};