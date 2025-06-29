// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error"
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Handle cast errors (invalid MongoDB ObjectIds)
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

// Handle duplicate field errors
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0]
  const value = err.keyValue[field]
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`
  return new AppError(message, 400)
}

// Handle validation errors
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message)
  const message = `Invalid input data: ${errors.join(". ")}`
  return new AppError(message, 400)
}

// Handle JWT errors
const handleJWTError = () => new AppError("Invalid token. Please log in again", 401)

const handleJWTExpiredError = () => new AppError("Your token has expired. Please log in again", 401)

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  })
}

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("ERROR 💥", err)

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    })
  }
}

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // Handle specific error types
    if (error.name === "CastError") error = handleCastErrorDB(error)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    if (error.name === "ValidationError") error = handleValidationErrorDB(error)
    if (error.name === "JsonWebTokenError") error = handleJWTError()
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError()

    sendErrorProd(error, res)
  }
}

// Async error wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
}
