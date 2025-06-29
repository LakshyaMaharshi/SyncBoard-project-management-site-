const { body, validationResult } = require("express-validator")
const { AppError } = require("./errorHandler")

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg)
    return next(new AppError(errorMessages.join(". "), 400))
  }
  next()
}

// User registration validation
const validateUserRegistration = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  body("role").isIn(["admin", "project_lead", "developer"]).withMessage("Invalid role specified"),
  handleValidationErrors,
]

// Project creation validation
const validateProjectCreation = [
  body("name").trim().isLength({ min: 3, max: 100 }).withMessage("Project name must be between 3 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Project description must be between 10 and 1000 characters"),
  body("deadline")
    .isISO8601()
    .withMessage("Please provide a valid deadline date")
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("Deadline must be in the future")
      }
      return true
    }),
  handleValidationErrors,
]

// Login validation
const validateLogin = [
  body("email").isEmail().normalizeEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
]

module.exports = {
  validateUserRegistration,
  validateProjectCreation,
  validateLogin,
  handleValidationErrors,
}
