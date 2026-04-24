/**
 * Global error handler — must be the last middleware in Express
 */
const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with that value already exists.',
    });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found.',
    });
  }

  // Prisma Connection Errors
  if (err.message.includes('Can\'t reach database server') || err.message.includes('Invalid `prisma.task.count()` invocation')) {
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please ensure PostgreSQL is running and DATABASE_URL is correct.',
    });
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

module.exports = { errorHandler };
