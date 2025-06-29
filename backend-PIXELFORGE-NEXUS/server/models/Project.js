const mongoose = require("mongoose")

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      minlength: [3, "Project name must be at least 3 characters long"],
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Project description is required"],
      trim: true,
      minlength: [10, "Project description must be at least 10 characters long"],
      maxlength: [1000, "Project description cannot exceed 1000 characters"],
    },
    deadline: {
      type: Date,
      required: [true, "Project deadline is required"],
      validate: {
        validator: (value) => value > new Date(),
        message: "Deadline must be in the future",
      },
    },
    status: {
      type: String,
      enum: ["active", "completed", "on_hold", "cancelled"],
      default: "active",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "Company is required"],
    },
    projectLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      validate: {
        validator: async (value) => {
          if (!value) return true // Optional field
          const user = await mongoose.model("User").findById(value)
          return user && (user.role === "project_lead" || user.role === "admin")
        },
        message: "Project lead must be a user with project_lead or admin role",
      },
    },
    assignedDevelopers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async (value) => {
            const user = await mongoose.model("User").findById(value)
            return user && user.role === "developer"
          },
          message: "Assigned developers must have developer role",
        },
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    documents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Document",
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, "Tag cannot exceed 20 characters"],
      },
    ],
    estimatedHours: {
      type: Number,
      min: [0, "Estimated hours cannot be negative"],
      max: [10000, "Estimated hours cannot exceed 10000"],
    },
    actualHours: {
      type: Number,
      min: [0, "Actual hours cannot be negative"],
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
projectSchema.index({ status: 1 })
projectSchema.index({ deadline: 1 })
projectSchema.index({ projectLead: 1 })
projectSchema.index({ assignedDevelopers: 1 })
projectSchema.index({ createdBy: 1 })
projectSchema.index({ company: 1 })
projectSchema.index({ createdAt: -1 })

// Virtual for checking if project is overdue
projectSchema.virtual("isOverdue").get(function () {
  return this.status === "active" && this.deadline < new Date()
})

// Virtual for days until deadline
projectSchema.virtual("daysUntilDeadline").get(function () {
  const now = new Date()
  const deadline = new Date(this.deadline)
  const diffTime = deadline - now
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Virtual for progress percentage (based on completed vs total estimated hours)
projectSchema.virtual("progressPercentage").get(function () {
  if (!this.estimatedHours || this.estimatedHours === 0) return 0
  return Math.min(Math.round((this.actualHours / this.estimatedHours) * 100), 100)
})

// Pre-save middleware to set completedAt when status changes to completed
projectSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date()
  }

  // Clear completedAt if status changes from completed to something else
  if (this.isModified("status") && this.status !== "completed" && this.completedAt) {
    this.completedAt = undefined
  }

  next()
})

// Get all active projects (for all users to view)
projectSchema.statics.getAllActiveProjects = function () {
  return this.find({ status: "active" })
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

// Get all active projects within a company
projectSchema.statics.getAllActiveProjectsByCompany = function (companyId) {
  return this.find({ status: "active", company: companyId })
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

// ✅ FIXED: Get projects by user role within their company
projectSchema.statics.getProjectsByUserRole = function (userId, userRole, companyId) {
  const query = { company: companyId }

  switch (userRole) {
    case "admin":
      // Admins can see all projects in their company
      break
    case "project_lead":
      // ✅ FIXED: Project leads see ONLY projects where they are assigned as projectLead
      query.projectLead = userId
      break
    case "developer":
      // Developers see projects they're assigned to
      query.assignedDevelopers = userId
      break
    default:
      // No access
      query._id = { $in: [] }
  }

  return this.find(query)
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

// ✅ FIXED: Static method to check if user can access project (within same company)
projectSchema.statics.canUserAccessProject = async function (projectId, userId, userRole, userCompanyId) {
  const project = await this.findById(projectId)
  if (!project) return false

  // Check if project belongs to user's company
  if (project.company.toString() !== userCompanyId.toString()) return false

  switch (userRole) {
    case "admin":
      return true
    case "project_lead":
      // ✅ FIXED: Project leads can only access projects where they are the assigned project lead
      return project.projectLead && project.projectLead.toString() === userId
    case "developer":
      return project.assignedDevelopers.some((dev) => dev.toString() === userId)
    default:
      return false
  }
}

// ✅ FIXED: Instance method to check if user can modify project (within same company)
projectSchema.methods.canUserModify = function (userId, userRole, userCompanyId) {
  // Check if project belongs to user's company
  if (this.company.toString() !== userCompanyId.toString()) return false

  if (userRole === "admin") return true

  // ✅ FIXED: Project leads can only modify projects where they are the assigned project lead
  if (userRole === "project_lead" && this.projectLead && this.projectLead.toString() === userId) return true

  return false
}

module.exports = mongoose.model("Project", projectSchema)
