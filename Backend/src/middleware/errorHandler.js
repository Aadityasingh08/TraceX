import logger from "../utils/logger.js";

export function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found - ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  logger.error(`${err.message} | ${req.method} ${req.originalUrl}`);
  res.status(statusCode).json({
    success: false,
    message: err.message,
  });
}