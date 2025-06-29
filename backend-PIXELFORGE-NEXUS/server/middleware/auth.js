const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { AppError } = require("./errorHandler")

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  })
}

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new AppError("Access token is required", 401))
    }

    const token = authHeader.split(" ")[1]

    // Verify token
    const decoded = verifyToken(token)

    // Check if user still exists and populate company
    const user = await User.findById(decoded.userId).select("+passwordChangedAt").populate("company")

    if (!user) {
      return next(new AppError("User no longer exists", 401))
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new AppError("User account is deactivated", 401))
    }

    // Check if company is active
    if (!user.company || !user.company.isActive) {
      return next(new AppError("Company account is deactivated", 401))
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return next(new AppError("User recently changed password. Please log in again", 401))
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new AppError("Account is temporarily locked due to too many failed login attempts", 423))
    }

    // Grant access to protected route
    req.user = user
    next()
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Invalid token", 401))
    } else if (error.name === "TokenExpiredError") {
      return next(new AppError("Token has expired", 401))
    }
    return next(new AppError("Authentication failed", 401))
  }
}

// Authorization middleware - check user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401))
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403))
    }

    next()
  }
}

// Admin only middleware (within company)
const adminOnly = authorize("admin")

// Admin or Project Lead middleware (within company)
const adminOrProjectLead = authorize("admin", "project_lead")

// Check if user can access specific project (within same company)
const checkProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId
    const userId = req.user._id.toString()
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    const Project = require("../models/Project")
    const canAccess = await Project.canUserAccessProject(projectId, userId, userRole, userCompanyId)

    if (!canAccess) {
      return next(new AppError("Access denied to this project", 403))
    }

    next()
  } catch (error) {
    return next(new AppError("Error checking project access", 500))
  }
}

// Check if user can modify specific project (within same company)
const checkProjectModifyAccess = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.params.projectId
    const userId = req.user._id.toString()
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    const Project = require("../models/Project")
    const project = await Project.findById(projectId)

    if (!project) {
      return next(new AppError("Project not found", 404))
    }

    if (!project.canUserModify(userId, userRole, userCompanyId)) {
      return next(new AppError("Insufficient permissions to modify this project", 403))
    }

    req.project = project
    next()
  } catch (error) {
    return next(new AppError("Error checking project modify access", 500))
  }
}

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next()
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    const user = await User.findById(decoded.userId).populate("company")

    if (user && user.isActive && !user.isLocked && user.company && user.company.isActive) {
      req.user = user
    }

    next()
  } catch (error) {
    // Continue without authentication
    next()
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
  adminOnly,
  adminOrProjectLead,
  checkProjectAccess,
  checkProjectModifyAccess,
  optionalAuth,
}
