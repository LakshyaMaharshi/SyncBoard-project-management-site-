const express = require("express")
const User = require("../models/User")
const { authenticate, adminOnly } = require("../middleware/auth")
const { AppError, catchAsync } = require("../middleware/errorHandler")

const router = express.Router()

router.use(authenticate)

router.get(
  "/developers",
  catchAsync(async (req, res, next) => {
    if (!["admin", "project_lead"].includes(req.user.role)) {
      return next(new AppError("Access denied", 403))
    }
    const developers = await User.find({
      role: "developer",
      isActive: true,
      company: req.user.company._id,
    }).select("-password -mfaSecret -mfaOtp -mfaOtpExpires -emailVerificationOtp -emailVerificationOtpExpires -__v")
    res.status(200).json({
      success: true,
      data: developers,
    })
  })
)

router.get(
  "/",
  adminOnly,
  catchAsync(async (req, res) => {
    const { role, isActive, page = 1, limit = 10 } = req.query

    const query = {}
    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === "true"

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

router.get(
  "/:id",
  catchAsync(async (req, res, next) => {
    const userId = req.params.id

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

router.put(
  "/:id",
  catchAsync(async (req, res, next) => {
    const userId = req.params.id
    const { name, email, role, isActive } = req.body

    const isOwnProfile = req.user._id.toString() === userId
    const isAdmin = req.user.role === "admin"

    if (!isOwnProfile && !isAdmin) {
      return next(new AppError("Access denied", 403))
    }

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError("User not found", 404))
    }

    const updateData = {}

    if (name && (isOwnProfile || isAdmin)) {
      updateData.name = name
    }

    if (email && (isOwnProfile || isAdmin)) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return next(new AppError("Email is already taken", 400))
      }
      updateData.email = email
    }

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
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
      "-passwordChangedAt -loginAttempts -lockUntil",
    )

    res.status(200).json({
      success: true,
      data: updatedUser,
    })
  }),
)

router.delete(
  "/:id",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const userId = req.params.id

    if (req.user._id.toString() === userId) {
      return next(new AppError("Cannot delete your own account", 400))
    }

    const user = await User.findById(userId)
    if (!user) {
      return next(new AppError("User not found", 404))
    }

    const Project = require("../models/Project")
    const assignedProjects = await Project.find({
      $or: [{ projectLead: userId }, { assignedDevelopers: userId }],
    })

    const notCompletedProjects = assignedProjects.filter(p => p.status !== "completed")

    if (notCompletedProjects.length > 0) {
      const projectNames = notCompletedProjects.map(p => p.name)
      return next(
        new AppError(
          `Cannot delete user. User is assigned to the following active projects: ${projectNames.join(", ")}`,
          400
        )
      )
    }

    await User.findByIdAndDelete(userId)

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
  })
)

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
