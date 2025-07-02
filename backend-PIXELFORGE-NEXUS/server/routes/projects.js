const express = require("express")
const Project = require("../models/Project")
const Document = require("../models/Document")
const User = require("../models/User")
const {
  authenticate,
  adminOnly,
  adminOrProjectLead,
  checkProjectAccess,
  checkProjectModifyAccess,
} = require("../middleware/auth")
const { uploadSingle, validateUploadedFile, cleanupUploadedFiles } = require("../middleware/upload")
const { AppError, catchAsync } = require("../middleware/errorHandler")
const { sendProjectAssignmentEmail } = require("../utils/email")
const fs = require("fs")
const path = require("path")

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Get all active projects (accessible to all users)
router.get(
  "/active",
  catchAsync(async (req, res) => {
    const projects = await Project.getAllActiveProjects()

    res.status(200).json({
      success: true,
      data: projects,
    })
  }),
)

// ✅ FIXED: Get role-specific projects for dashboard
router.get(
  "/",
  catchAsync(async (req, res) => {
    const projects = await Project.getProjectsByUserRole(req.user._id, req.user.role, req.user.company._id)

    res.status(200).json({
      success: true,
      data: projects,
    })
  }),
)

// Get single project
router.get(
  "/:id",
  checkProjectAccess,
  catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)
      .populate("projectLead", "name email role")
      .populate("assignedDevelopers", "name email role")
      .populate("createdBy", "name email")
      .populate("documents")

    if (!project) {
      return next(new AppError("Project not found", 404))
    }

    res.status(200).json({
      success: true,
      data: project,
    })
  }),
)

// Create new project (Admin only) - Now includes company
router.post(
  "/",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const { name, description, deadline, projectLead, priority, estimatedHours, tags } = req.body

    // Validate required fields
    if (!name || !description || !deadline) {
      return next(new AppError("Name, description, and deadline are required", 400))
    }

    // Validate deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return next(new AppError("Deadline must be in the future", 400))
    }

    // Validate project lead if provided (must be from same company)
    if (projectLead) {
      const lead = await User.findById(projectLead)
      if (!lead || (lead.role !== "project_lead" && lead.role !== "admin")) {
        return next(new AppError("Project lead must be a user with project_lead or admin role", 400))
      }

      // Check if project lead is from the same company
      if (lead.company.toString() !== req.user.company._id.toString()) {
        return next(new AppError("Project lead must be from the same company", 400))
      }
    }

    const projectData = {
      name,
      description,
      deadline,
      company: req.user.company._id,
      createdBy: req.user._id,
      priority: priority || "medium",
      estimatedHours,
      tags,
    }

    if (projectLead) {
      projectData.projectLead = projectLead
    }

    const project = new Project(projectData)
    await project.save()

    // Populate the created project
    await project.populate("projectLead", "name email role")
    await project.populate("createdBy", "name email")
    await project.populate("company", "name")

    res.status(201).json({
      success: true,
      data: project,
    })
  }),
)

// Update project
router.put(
  "/:id",
  checkProjectModifyAccess,
  catchAsync(async (req, res, next) => {
    const { name, description, deadline, status, priority, estimatedHours, actualHours, tags, projectLead } = req.body

    const updateData = {}

    if (name) updateData.name = name
    if (description) updateData.description = description
    if (deadline) {
      if (new Date(deadline) <= new Date()) {
        return next(new AppError("Deadline must be in the future", 400))
      }
      updateData.deadline = deadline
    }
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours
    if (actualHours !== undefined) updateData.actualHours = actualHours
    if (tags) updateData.tags = tags

    // Only admins can change project lead
    if (projectLead !== undefined && req.user.role === "admin") {
      if (projectLead) {
        const lead = await User.findById(projectLead)
        if (!lead || (lead.role !== "project_lead" && lead.role !== "admin")) {
          return next(new AppError("Project lead must be a user with project_lead or admin role", 400))
        }

        if (lead.company.toString() !== req.user.company._id.toString()) {
          return next(new AppError("Project lead must be from the same company", 400))
        }
      }
      updateData.projectLead = projectLead
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
      .populate("projectLead", "name email role")
      .populate("assignedDevelopers", "name email role")
      .populate("createdBy", "name email")
      .populate("company", "name")

    res.status(200).json({
      success: true,
      data: project,
    })
  }),
)

// Mark project as completed (Admin and Project Lead only)
router.patch(
  "/:id/complete",
  adminOrProjectLead,
  catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return next(new AppError("Project not found", 404))
    }

    // Check if project belongs to user's company
    if (project.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Access denied to this project", 403))
    }

    // Check if user is project lead for this project
    if (req.user.role === "project_lead" && project.projectLead.toString() !== req.user._id.toString()) {
      return next(new AppError("Only the project lead can mark this project as completed", 403))
    }

    // Update project status to completed
    project.status = "completed"
    project.completedAt = new Date()
    await project.save()

    // Populate the updated project
    await project.populate("projectLead", "name email role")
    await project.populate("assignedDevelopers", "name email role")
    await project.populate("createdBy", "name email")
    await project.populate("company", "name")

    res.status(200).json({
      success: true,
      message: "Project marked as completed successfully",
      data: project,
    })
  }),
)

// Delete project (Admin only)
router.delete(
  "/:id",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return next(new AppError("Project not found", 404))
    }

    // Check if project belongs to user's company
    if (project.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Access denied to this project", 403))
    }

    // Delete associated documents
    const documents = await Document.find({ project: req.params.id })
    for (const doc of documents) {
      // Delete file from filesystem
      if (fs.existsSync(doc.path)) {
        fs.unlinkSync(doc.path)
      }
      await doc.remove()
    }

    // Delete project directory
    const projectDir = path.join(__dirname, "../uploads", req.params.id)
    if (fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true })
    }

    await project.remove()

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    })
  }),
)

// Assign developer to project
router.post(
  "/:id/assign",
  checkProjectModifyAccess,
  catchAsync(async (req, res, next) => {
    const { developerId } = req.body

    if (!developerId) {
      return next(new AppError("Developer ID is required", 400))
    }

    // Validate developer exists and has correct role (must be from same company)
    const developer = await User.findById(developerId)
    if (!developer || developer.role !== "developer") {
      return next(new AppError("Invalid developer ID", 400))
    }

    // Check if developer is from the same company
    if (developer.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Developer must be from the same company", 400))
    }

    const project = req.project

    // Check if developer is already assigned
    if (project.assignedDevelopers.includes(developerId)) {
      return next(new AppError("Developer is already assigned to this project", 400))
    }

    // Add developer to project
    project.assignedDevelopers.push(developerId)
    await project.save()

    // Populate the updated project
    await project.populate("assignedDevelopers", "name email role")

    // Send notification email (optional, don't fail if email fails)
    try {
      await sendProjectAssignmentEmail(developer.email, developer.name, project.name, project.description)
    } catch (error) {
      console.error("Failed to send project assignment email:", error)
    }

    res.status(200).json({
      success: true,
      data: project,
    })
  }),
)

// Remove developer from project
router.post(
  "/:id/remove",
  checkProjectModifyAccess,
  catchAsync(async (req, res, next) => {
    const { developerId } = req.body

    if (!developerId) {
      return next(new AppError("Developer ID is required", 400))
    }

    const project = req.project

    // Check if developer is assigned
    if (!project.assignedDevelopers.includes(developerId)) {
      return next(new AppError("Developer is not assigned to this project", 400))
    }

    // Remove developer from project
    project.assignedDevelopers = project.assignedDevelopers.filter((dev) => dev.toString() !== developerId)
    await project.save()

    // Populate the updated project
    await project.populate("assignedDevelopers", "name email role")

    res.status(200).json({
      success: true,
      data: project,
    })
  }),
)

// ✅ FIXED: Upload document to project (Admin and Project Lead only)
router.post(
  "/:id/documents",
  cleanupUploadedFiles,
  uploadSingle("document"),
  validateUploadedFile,
  catchAsync(async (req, res, next) => {
    const projectId = req.params.id
    const userId = req.user._id
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    // console.log("userRole", userRole, typeof userRole)
    // console.log("userCompanyId", userCompanyId, typeof userCompanyId)
    // console.log("userId", userId, typeof userId)
    // console.log("projectId", projectId, typeof projectId)

    // Check if user can upload to this project
    const canUpload = await Document.canUserUploadToProject(projectId, userId, userRole, userCompanyId)
    if (!canUpload) {
      return next(new AppError("Insufficient permissions to upload documents to this project", 403))
    }

    const file = req.file
    const { description, tags } = req.body

    // Create document record
    const document = new Document({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      project: projectId,
      uploadedBy: userId,
      description,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
    })

    await document.save()

    // Add document to project
    await Project.findByIdAndUpdate(projectId, {
      $push: { documents: document._id },
    })

    // Populate the document
    await document.populate("uploadedBy", "name email")

    res.status(201).json({
      success: true,
      data: document,
    })
  }),
)

// ✅ FIXED: Get project documents (with proper access control)
router.get(
  "/:id/documents",
  catchAsync(async (req, res, next) => {
    const projectId = req.params.id
    const userId = req.user._id
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    // console.log("userRole", userRole, typeof userRole)
    // console.log("userCompanyId", userCompanyId, typeof userCompanyId)
    // console.log("userId", userId, typeof userId)
    // console.log("projectId", projectId, typeof projectId)

    try {
      const documents = await Document.getProjectDocuments(projectId, userId, userRole, userCompanyId)

      res.status(200).json({
        success: true,
        count: documents.length,
        data: documents,
      })
    } catch (error) {
      return next(new AppError(error.message, 403))
    }
  }),
)

// ✅ FIXED: Download document (with proper access control)
// router.get(
//   "/:id/documents/:documentId/download",
//   catchAsync(async (req, res, next) => {
//     const { documentId } = req.params
//     const userId = req.user._id
//     const userRole = req.user.role
//     const userCompanyId = req.user.company._id

//     const document = await Document.findById(documentId).populate("project")

//     if (!document) {
//       return next(new AppError("Document not found", 404))
//     }

//     // Check if user can access this project's documents
//     const canAccess = await Project.canUserAccessProject(document.project._id, userId, userRole, userCompanyId)
//     if (!canAccess) {
//       return next(new AppError("Access denied to this document", 403))
//     }

//     // Check if file exists
//     if (!fs.existsSync(document.path)) {
//       return next(new AppError("File not found on server", 404))
//     }

//     // Increment download count
//     await document.incrementDownloadCount()

//     // Set appropriate headers
//     res.setHeader("Content-Disposition", `attachment; filename="${document.originalName}"`)
//     res.setHeader("Content-Type", document.mimetype)

//     // Stream the file
//     const fileStream = fs.createReadStream(document.path)
//     fileStream.pipe(res)
//   }),
// )

// ✅ FIXED: Delete document (Admin and Project Lead only)
router.delete(
  "/:id/documents/:documentId",
  catchAsync(async (req, res, next) => {
    const { documentId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    // Check if user can delete this document
    const canDelete = await Document.canUserDeleteDocument(documentId, userId, userRole, userCompanyId)
    if (!canDelete) {
      return next(new AppError("Insufficient permissions to delete this document", 403))
    }

    const document = await Document.findById(documentId)
    if (!document) {
      return next(new AppError("Document not found", 404))
    }

    // Delete file from filesystem
    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path)
    }

    // Remove document from project
    await Project.findByIdAndUpdate(req.params.id, {
      $pull: { documents: documentId },
    })

    // Delete document record
    await document.deleteOne()

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    })
  }),
)

module.exports = router
