const mongoose = require("mongoose")
const path = require("path")

const documentSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: [true, "Filename is required"],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, "Original filename is required"],
      trim: true,
    },
    mimetype: {
      type: String,
      required: [true, "File mimetype is required"],
      validate: {
        validator: (value) => {
          const allowedTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "text/plain",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ]
          return allowedTypes.includes(value)
        },
        message: "File type not supported",
      },
    },
    size: {
      type: Number,
      required: [true, "File size is required"],
      max: [10 * 1024 * 1024, "File size cannot exceed 10MB"],
    },
    path: {
      type: String,
      required: [true, "File path is required"],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: [true, "Project reference is required"],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader reference is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    version: {
      type: Number,
      default: 1,
      min: [1, "Version must be at least 1"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: [0, "Download count cannot be negative"],
    },
    lastDownloaded: {
      type: Date,
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [20, "Tag cannot exceed 20 characters"],
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

documentSchema.index({ project: 1 })
documentSchema.index({ uploadedBy: 1 })
documentSchema.index({ createdAt: -1 })
documentSchema.index({ isActive: 1 })
documentSchema.index({ mimetype: 1 })

documentSchema.virtual("extension").get(function () {
  return path.extname(this.originalName).toLowerCase()
})

documentSchema.virtual("sizeFormatted").get(function () {
  const bytes = this.size
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
})

documentSchema.virtual("category").get(function () {
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"]
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ]
  const spreadsheetTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]

  if (imageTypes.includes(this.mimetype)) return "image"
  if (documentTypes.includes(this.mimetype)) return "document"
  if (spreadsheetTypes.includes(this.mimetype)) return "spreadsheet"
  return "other"
})

documentSchema.virtual("downloadUrl").get(function () {
  return `/api/projects/${this.project}/documents/${this._id}/download`
})

documentSchema.methods.incrementDownloadCount = function () {
  this.downloadCount += 1
  this.lastDownloaded = new Date()
  return this.save()
}

documentSchema.statics.getProjectDocuments = async function (projectId, userId, userRole, userCompanyId) {
  const Project = mongoose.model("Project")
  const project = await Project.findById(projectId)

  if (!project) {
    throw new Error("Project not found")
  }

  if (project.company.toString() !== userCompanyId.toString()) {
    throw new Error("Access denied to project documents")
  }

  let hasAccess = false

  if (userRole === "admin") {
    hasAccess = true
  } else if (userRole === "project_lead") {
    hasAccess = project.projectLead && project.projectLead.toString() === userId.toString()
  } else if (userRole === "developer") {
    hasAccess = project.assignedDevelopers.some((dev) => dev.toString() === userId.toString())
  }

  if (!hasAccess) {
    throw new Error("Access denied to project documents")
  }

  return this.find({ project: projectId, isActive: true }).populate("uploadedBy", "name email").sort({ createdAt: -1 })
}

documentSchema.statics.canUserUploadToProject = async (projectId, userId, userRole, userCompanyId) => {
  const Project = mongoose.model("Project")
  const project = await Project.findById(projectId)

  if (!project) return false

  if (project.company.toString() !== userCompanyId.toString()) return false

  if (userRole === "admin") return true

  if (userRole === "project_lead") {
    return project.projectLead && project.projectLead.toString() === userId.toString()
  }

  return false
}
documentSchema.statics.canUserDeleteDocument = async function (documentId, userId, userRole, userCompanyId) {
  const document = await this.findById(documentId).populate("project")

  if (!document) {
    console.log("document not found")
    return false
  }

  if (document.project.company.toString() !== userCompanyId.toString()) {
    console.log("project does not belong to user's company")
    return false
  }

  if (userRole === "admin") {
    console.log("admin can delete document")
    return true
  }

  if (userRole === "project_lead") {
    console.log("project lead can delete document")
    return document.project.projectLead && document.project.projectLead.toString() === userId.toString()
  }

  return false
}

documentSchema.pre("remove", function (next) {
  const fs = require("fs")
  const filePath = this.path

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("Error deleting file:", err)
    }
    next()
  })
})

module.exports = mongoose.model("Document", documentSchema)
