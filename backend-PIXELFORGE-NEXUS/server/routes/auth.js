const express = require("express")
const rateLimit = require("express-rate-limit")
const User = require("../models/User")
const Company = require("../models/Company")
const { generateToken, authenticate } = require("../middleware/auth")
const { AppError, catchAsync } = require("../middleware/errorHandler")
const { generateMFASecret, generateQRCode, verifyMFAToken, validateMFATokenFormat } = require("../utils/mfa")

const router = express.Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many authentication attempts, please try again later.",
})

// Login endpoint
router.post(
  "/login",
  authLimiter,
  catchAsync(async (req, res, next) => {
    const { email, password, mfaCode } = req.body

    // Validate input
    if (!email || !password) {
      return next(new AppError("Email and password are required", 400))
    }

    // Find user with password
    const user = await User.findByEmailWithPassword(email)

    if (!user) {
      return next(new AppError("Invalid email or password", 401))
    }

    // Check if account is locked
    if (user.isLocked) {
      return next(new AppError("Account is temporarily locked due to too many failed login attempts", 423))
    }

    // Verify password
    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await user.incLoginAttempts()
      return next(new AppError("Invalid email or password", 401))
    }

    // Check MFA if enabled
    if (user.mfaEnabled) {
      if (!mfaCode) {
        return res.status(200).json({
          success: false,
          requiresMFA: true,
          message: "MFA code required",
        })
      }

      if (!validateMFATokenFormat(mfaCode)) {
        return next(new AppError("Invalid MFA code format", 400))
      }

      const isMFAValid = verifyMFAToken(mfaCode, user.mfaSecret)

      if (!isMFAValid) {
        await user.incLoginAttempts()
        return next(new AppError("Invalid MFA code", 401))
      }
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts()
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save({ validateBeforeSave: false })

    // Generate token
    const token = generateToken(user._id)

    // Remove sensitive data from response
    const userResponse = user.toJSON()
    delete userResponse.passwordChangedAt
    delete userResponse.loginAttempts
    delete userResponse.lockUntil

    res.status(200).json({
      success: true,
      data: {
        token,
        user: userResponse,
      },
    })
  }),
)

// Register endpoint (Public - creates company admin and auto-login)
router.post(
  "/register",
  catchAsync(async (req, res, next) => {
    const { name, email, password, companyName, companyDescription, industry, companySize } = req.body

    // Validate input
    if (!name || !email || !password || !companyName) {
      return next(new AppError("Name, email, password, and company name are required", 400))
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400))
    }

    // Check if company name already exists
    const existingCompany = await Company.findOne({ name: companyName })
    if (existingCompany) {
      return next(new AppError("Company name already exists. Please choose a different name.", 400))
    }

    // Start a transaction to ensure data consistency
    const session = await User.startSession()

    let createdUser, createdCompany

    try {
      await session.withTransaction(async () => {
        // Create admin user first (without company reference temporarily)
        const newUser = new User({
          name,
          email,
          password,
          role: "admin", // First user becomes admin of their company
          // company will be set after company creation
        })

        // Save user without company reference first
        await newUser.save({ session, validateBeforeSave: false })

        // Create company with the user as creator
        const company = new Company({
          name: companyName,
          description: companyDescription,
          industry,
          size: companySize || "1-10",
          createdBy: newUser._id, // Now we have the user ID
        })

        await company.save({ session })

        // Update user with company reference
        newUser.company = company._id
        await newUser.save({ session })

        // Store the created data for response
        createdUser = newUser
        createdCompany = company
      })

      // Populate the user with company data for response
      const userWithCompany = await User.findById(createdUser._id).populate("company")

      // Update last login for the new user
      userWithCompany.lastLogin = new Date()
      await userWithCompany.save({ validateBeforeSave: false })

      // Generate token for auto-login
      const token = generateToken(userWithCompany._id)

      // Remove password from response
      const userResponse = userWithCompany.toJSON()
      delete userResponse.passwordChangedAt
      delete userResponse.loginAttempts
      delete userResponse.lockUntil

      res.status(201).json({
        success: true,
        message: "Company and admin user created successfully",
        data: {
          token, // ✅ Now sending token for auto-login
          user: userResponse,
          company: createdCompany,
        },
      })
    } catch (error) {
      console.error("Registration transaction failed:", error)
      return next(new AppError("Failed to create company and user account", 500))
    } finally {
      await session.endSession()
    }
  }),
)

// Register team member endpoint (Admin only within company)
router.post(
  "/register-team-member",
  authenticate,
  catchAsync(async (req, res, next) => {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return next(new AppError("Only administrators can register new team members", 403))
    }

    const { name, email, password, role } = req.body

    // Validate input
    if (!name || !email || !password || !role) {
      return next(new AppError("Name, email, password, and role are required", 400))
    }

    // Validate role
    const validRoles = ["project_lead", "developer"]
    if (!validRoles.includes(role)) {
      return next(new AppError("Invalid role specified. Only project_lead and developer roles are allowed.", 400))
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return next(new AppError("User with this email already exists", 400))
    }

    // Create new user in the same company as the admin
    const newUser = new User({
      name,
      email,
      password,
      role,
      company: req.user.company._id,
    })

    await newUser.save()

    // Populate company data
    await newUser.populate("company")

    // Remove password from response
    const userResponse = newUser.toJSON()

    res.status(201).json({
      success: true,
      message: "Team member registered successfully",
      user: userResponse,
    })
  }),
)

// Verify token endpoint
router.get(
  "/verify",
  authenticate,
  catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      user: req.user,
    })
  }),
)

// Update password endpoint
router.put(
  "/password",
  authenticate,
  catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body

    // Validate input
    if (!currentPassword || !newPassword) {
      return next(new AppError("Current password and new password are required", 400))
    }

    // Get user with password
    const user = await User.findById(req.user._id).select("+password")

    // Verify current password
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword)

    if (!isCurrentPasswordCorrect) {
      return next(new AppError("Current password is incorrect", 400))
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return next(new AppError("New password must be at least 8 characters long", 400))
    }

    // Update password
    user.password = newPassword
    await user.save()

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    })
  }),
)

// Setup MFA endpoint
router.post(
  "/mfa/setup",
  authenticate,
  catchAsync(async (req, res, next) => {
    const user = req.user

    // Check if MFA is already enabled
    if (user.mfaEnabled) {
      return next(new AppError("MFA is already enabled for this account", 400))
    }

    // Generate MFA secret
    const { secret, otpauthUrl } = generateMFASecret(user.email)

    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl)

    res.status(200).json({
      success: true,
      secret,
      qrCode,
    })
  }),
)

// Enable MFA endpoint
router.post(
  "/mfa/enable",
  authenticate,
  catchAsync(async (req, res, next) => {
    const { token, secret } = req.body

    // Validate input
    if (!token || !secret) {
      return next(new AppError("MFA token and secret are required", 400))
    }

    if (!validateMFATokenFormat(token)) {
      return next(new AppError("Invalid MFA token format", 400))
    }

    // Verify MFA token
    const isTokenValid = verifyMFAToken(token, secret)

    if (!isTokenValid) {
      return next(new AppError("Invalid MFA token", 400))
    }

    // Update user with MFA settings
    const user = await User.findById(req.user._id)
    user.mfaEnabled = true
    user.mfaSecret = secret
    await user.save()

    res.status(200).json({
      success: true,
      message: "MFA enabled successfully",
    })
  }),
)

// Disable MFA endpoint
router.post(
  "/mfa/disable",
  authenticate,
  catchAsync(async (req, res, next) => {
    const { token } = req.body

    // Validate input
    if (!token) {
      return next(new AppError("MFA token is required", 400))
    }

    if (!validateMFATokenFormat(token)) {
      return next(new AppError("Invalid MFA token format", 400))
    }

    // Get user with MFA secret
    const user = await User.findById(req.user._id).select("+mfaSecret")

    if (!user.mfaEnabled) {
      return next(new AppError("MFA is not enabled for this account", 400))
    }

    // Verify MFA token
    const isTokenValid = verifyMFAToken(token, user.mfaSecret)

    if (!isTokenValid) {
      return next(new AppError("Invalid MFA token", 400))
    }

    // Disable MFA
    user.mfaEnabled = false
    user.mfaSecret = undefined
    await user.save()

    res.status(200).json({
      success: true,
      message: "MFA disabled successfully",
    })
  }),
)

module.exports = router
