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

router.use(authenticate)

router.get(
  "/active",
  catchAsync(async (req, res) => {
    const projects = await Project.getAllActiveProjectsByCompany(req.user.company._id)

    res.status(200).json({
      success: true,
      data: projects,
    })
  }),
)
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
router.post(
  "/",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const { name, description, deadline, projectLead, priority, estimatedHours, tags } = req.body

    if (!name || !description || !deadline) {
      return next(new AppError("Name, description, and deadline are required", 400))
    }
    if (new Date(deadline) <= new Date()) {
      return next(new AppError("Deadline must be in the future", 400))
    }

    if (projectLead) {
      const lead = await User.findById(projectLead)
      if (!lead || (lead.role !== "project_lead" && lead.role !== "admin")) {
        return next(new AppError("Project lead must be a user with project_lead or admin role", 400))
      }
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
    await project.populate("projectLead", "name email role")
    await project.populate("createdBy", "name email")
    await project.populate("company", "name")

    res.status(201).json({
      success: true,
      data: project,
    })
  }),
)
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
router.patch(
  "/:id/complete",
  adminOrProjectLead,
  catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return next(new AppError("Project not found", 404))
    }
    if (project.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Access denied to this project", 403))
    }
    if (req.user.role === "project_lead" && project.projectLead.toString() !== req.user._id.toString()) {
      return next(new AppError("Only the project lead can mark this project as completed", 403))
    }
    project.status = "completed"
    project.completedAt = new Date()
    await project.save()
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
router.delete(
  "/:id",
  adminOnly,
  catchAsync(async (req, res, next) => {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return next(new AppError("Project not found", 404))
    }
    if (project.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Access denied to this project", 403))
    }
    const documents = await Document.find({ project: req.params.id })
    for (const doc of documents) {
      if (fs.existsSync(doc.path)) {
        fs.unlinkSync(doc.path)
      }
      await doc.remove()
    }
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
router.post(
  "/:id/assign",
  checkProjectModifyAccess,
  catchAsync(async (req, res, next) => {
    const { developerId } = req.body

    if (!developerId) {
      return next(new AppError("Developer ID is required", 400))
    }
    const developer = await User.findById(developerId)
    if (!developer || developer.role !== "developer") {
      return next(new AppError("Invalid developer ID", 400))
    }
    if (developer.company.toString() !== req.user.company._id.toString()) {
      return next(new AppError("Developer must be from the same company", 400))
    }

    const project = req.project
    if (project.assignedDevelopers.includes(developerId)) {
      return next(new AppError("Developer is already assigned to this project", 400))
    }
    project.assignedDevelopers.push(developerId)
    await project.save()
    await project.populate("assignedDevelopers", "name email role")
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
router.post(
  "/:id/remove",
  checkProjectModifyAccess,
  catchAsync(async (req, res, next) => {
    const { developerId } = req.body

    if (!developerId) {
      return next(new AppError("Developer ID is required", 400))
    }

    const project = req.project
    if (!project.assignedDevelopers.includes(developerId)) {
      return next(new AppError("Developer is not assigned to this project", 400))
    }
    project.assignedDevelopers = project.assignedDevelopers.filter((dev) => dev.toString() !== developerId)
    await project.save()
    await project.populate("assignedDevelopers", "name email role")

    res.status(200).json({
      success: true,
      data: project,
    })
  }),
)
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

    const canUpload = await Document.canUserUploadToProject(projectId, userId, userRole, userCompanyId)
    if (!canUpload) {
      return next(new AppError("Insufficient permissions to upload documents to this project", 403))
    }

    const file = req.file
    const { description, tags } = req.body

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

    await Project.findByIdAndUpdate(projectId, {
      $push: { documents: document._id },
    })
    await document.populate("uploadedBy", "name email")

    res.status(201).json({
      success: true,
      data: document,
    })
  }),
)
router.get(
  "/:id/documents",
  catchAsync(async (req, res, next) => {
    const projectId = req.params.id
    const userId = req.user._id
    const userRole = req.user.role
    const userCompanyId = req.user.company._id


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
router.delete(
  "/:id/documents/:documentId",
  catchAsync(async (req, res, next) => {
    const { documentId } = req.params
    const userId = req.user._id
    const userRole = req.user.role
    const userCompanyId = req.user.company._id

    const canDelete = await Document.canUserDeleteDocument(documentId, userId, userRole, userCompanyId)
    if (!canDelete) {
      return next(new AppError("Insufficient permissions to delete this document", 403))
    }

    const document = await Document.findById(documentId)
    if (!document) {
      return next(new AppError("Document not found", 404))
    }

    if (fs.existsSync(document.path)) {
      fs.unlinkSync(document.path)
    }

    await Project.findByIdAndUpdate(req.params.id, {
      $pull: { documents: documentId },
    })

    await document.deleteOne()

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    })
  }),
)

module.exports = router
