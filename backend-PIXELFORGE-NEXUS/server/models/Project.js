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
          if (!value) return true 
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

projectSchema.index({ status: 1 })
projectSchema.index({ deadline: 1 })
projectSchema.index({ projectLead: 1 })
projectSchema.index({ assignedDevelopers: 1 })
projectSchema.index({ createdBy: 1 })
projectSchema.index({ company: 1 })
projectSchema.index({ createdAt: -1 })

projectSchema.virtual("isOverdue").get(function () {
  return this.status === "active" && this.deadline < new Date()
})
projectSchema.virtual("daysUntilDeadline").get(function () {
  const now = new Date()
  const deadline = new Date(this.deadline)
  const diffTime = deadline - now
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

projectSchema.virtual("progressPercentage").get(function () {
  if (!this.estimatedHours || this.estimatedHours === 0) return 0
  return Math.min(Math.round((this.actualHours / this.estimatedHours) * 100), 100)
})

projectSchema.pre("save", function (next) {
  if (this.isModified("status") && this.status === "completed" && !this.completedAt) {
    this.completedAt = new Date()
  }
  if (this.isModified("status") && this.status !== "completed" && this.completedAt) {
    this.completedAt = undefined
  }

  next()
})

projectSchema.statics.getAllActiveProjects = function () {
  return this.find({ status: "active" })
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

projectSchema.statics.getAllActiveProjectsByCompany = function (companyId) {
  return this.find({ status: "active", company: companyId })
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

projectSchema.statics.getProjectsByUserRole = function (userId, userRole, companyId) {
  const query = { company: companyId }

  switch (userRole) {
    case "admin":
      break
    case "project_lead":
      query.projectLead = userId
      break
    case "developer":
      query.assignedDevelopers = userId
      break
    default:
      query._id = { $in: [] }
  }

  return this.find(query)
    .populate("projectLead", "name email role")
    .populate("assignedDevelopers", "name email role")
    .populate("createdBy", "name email")
    .populate("documents")
    .sort({ createdAt: -1 })
}

projectSchema.statics.canUserAccessProject = async function (projectId, userId, userRole, userCompanyId) {
  const project = await this.findById(projectId)
  if (!project) return false

  if (project.company.toString() !== userCompanyId.toString()) return false

  switch (userRole) {
    case "admin":
      return true
    case "project_lead":
      return project.projectLead && project.projectLead.toString() === userId
    case "developer":
      return project.assignedDevelopers.some((dev) => dev.toString() === userId)
    default:
      return false
  }
}

projectSchema.methods.canUserModify = function (userId, userRole, userCompanyId) {
  if (this.company.toString() !== userCompanyId.toString()) return false

  if (userRole === "admin") return true

  if (userRole === "project_lead" && this.projectLead && this.projectLead.toString() === userId) return true

  return false
}

module.exports = mongoose.model("Project", projectSchema)
