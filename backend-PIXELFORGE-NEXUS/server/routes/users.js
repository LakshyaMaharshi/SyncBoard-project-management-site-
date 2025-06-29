const express = require("express")
const User = require("../models/User")
const { authenticate, adminOnly } = require("../middleware/auth")
const { AppError, catchAsync } = require("../middleware/errorHandler")

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all users (Admin only)
router.get(
  "/",
  adminOnly,
  catchAsync(async (req, res) => {
    const { role, isActive, page = 1, limit = 10 } = req.query

    // Build query
    const query = {}
    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === "true"

    // Calculate pagination
    const skip = (page - 1) * limit

    const users = await User.find(query)
      .select("-passwordChangedAt -loginAttempts -lockUntil")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number.parseInt(limit))

    const total = await User.countDocuments(query)

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page: Number.parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
    })
  }),
)

// Get single user
router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    const userId = req.params.id

    // Users can only view their own profile unless they're admin
    if (req.user.role !== "admin" && req.user._id.toString() !== userId) {
      return next(new AppError("Access denied", 403))
    }

    const user = await User.findById(userId).select("-passwordChangedAt -loginAttempts -lockUntil")

    if (!user) {
      return next(new AppError("User not found", 404))
    }

    res.status(200).json({
      success: true,
      data: user,
    })
  }),
)

// Update user (Admin only for role changes, users can update their own profile)
router.put(
  "/:id",
  catchAsync(async (req, res, next) => {
    const userId = req.params.id
    const { name, email, role, isActive } = req.body

    // Check permissions
    const isOwnProfile = req.user._id.toString() === userId
    const isAdmin = req.user.role === "admin"

    if (!isOwnProfile && !isAdmin) {
      return next(new AppError("Access denied", 403))
    }

    // Find user
    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError("User not found", 404))
    }

    // Build update object
    const updateData = {}

    // Anyone can update their own name and email
    if (name && (isOwnProfile || isAdmin)) {
      updateData.name = name
    }

    if (email && (isOwnProfile || isAdmin)) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return next(new AppError("Email is already taken", 400))
      }
      updateData.email = email
    }

    // Only admins can update role and active status
    if (isAdmin) {
      if (role) {
        const validRoles = ["admin", "project_lead", "developer"]
        if (!validRoles.includes(role)) {
          return next(new AppError("Invalid role specified", 400))
        }
        updateData.role = role
      }

      if (isActive !== undefined) {
        updateData.isActive = isActive
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
      "-passwordChangedAt -loginAttempts -lockUntil",
    )

    res.status(200).json({
      success: true,
      data: updatedUser,
    })
  }),
)

// Delete user (Admin only)
router.delete(
  "/:id",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const userId = req.params.id

    // Prevent admin from deleting themselves
    if (req.user._id.toString() === userId) {
      return next(new AppError("Cannot delete your own account", 400))
    }

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError("User not found", 404))
    }

    // Check if user is assigned to any active projects
    const Project = require("../models/Project")
    const activeProjects = await Project.find({
      $or: [{ projectLead: userId }, { assignedDevelopers: userId }],
      status: { $ne: "completed" },
    })

    if (activeProjects.length > 0) {
      return next(new AppError("Cannot delete user who is assigned to active projects", 400))
    }

    // Soft delete - deactivate instead of removing
    user.isActive = false
    user.email = `deleted_${Date.now()}_${user.email}`
    await user.save()

    res.status(200).json({
      success: true,
      message: "User deactivated successfully",
    })
  }),
)

// Get user statistics (Admin only)
router.get(
  "/stats/overview",
  adminOnly,
  catchAsync(async (req, res) => {
    const stats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ["$isActive", true] }, 1, 0],
            },
          },
        },
      },
    ])

    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    })

    res.status(200).json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        recent: recentUsers,
        byRole: stats,
      },
    })
  }),
)

module.exports = router
