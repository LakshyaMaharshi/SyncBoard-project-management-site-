"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { projectAPI } from "../../services/api"
import DocumentUpload from "./DocumentUpload"
import "./ProjectDetails.css"
import axios from "axios"

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (id) {
      fetchProject()
    }
  }, [id])

  const fetchProject = async () => {
    try {
      setLoading(true)
      const response = await projectAPI.getProject(id)
      setProject(response.data.data)
      setError("")
    } catch (error) {
      console.error("Failed to fetch project:", error)
      setError("Failed to load project details")
    } finally {
      setLoading(false)
    }
  }

  const fetchDocuments = async () => {
    try {
      setDocumentsLoading(true)
      const response = await projectAPI.getProjectDocuments(id)
      setDocuments(response.data.data)
      setShowDocuments(true)
      setError("")
    } catch (error) {
      console.error("Failed to fetch documents:", error)
      setError("Failed to load documents. You may not have permission to view documents for this project.")
      setDocuments([])
    } finally {
      setDocumentsLoading(false)
    }
  }

  const handleDocumentUpload = async (file, description) => {
    const formData = new FormData()
    formData.append("document", file)
    if (description) {
      formData.append("description", description)
    }

    try {
      await projectAPI.uploadDocument(id, formData)
      setShowUpload(false)
      if (showDocuments) {
        fetchDocuments() // Refresh documents if they're being shown
      }
      alert("Document uploaded successfully!")
      return { success: true }
    } catch (error) {
      console.error("Upload failed:", error)
      const errorMessage = error.response?.data?.message || "Failed to upload document"
      alert(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const handleDocumentDelete = async (documentId) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await projectAPI.deleteDocument(id, documentId)
        fetchDocuments() // Refresh documents
        alert("Document deleted successfully!")
      } catch (error) {
        console.error("Delete failed:", error)
        alert("Failed to delete document")
      }
    }
  }

  const canUploadDocuments = () => {
    if (!project || !user) return false
    return (
      user.role === "admin" ||
      (user.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id))
    )
  }

  const canViewProject = () => {
    if (!project || !user) return false
    if (user.role === "admin") return true
    if (user.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id))
      return true
    if (
      user.role === "developer" &&
      project.assignedDevelopers?.some((dev) => dev === user._id || dev._id === user._id)
    )
      return true
    return false
  }

  const canViewDocuments = () => {
    if (!project || !user) return false
    if (user.role === "admin") return true
    if (user.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id))
      return true
    if (
      user.role === "developer" &&
      project.assignedDevelopers?.some((dev) => dev === user._id || dev._id === user._id)
    )
      return true
    return false
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const downloadDocument = async (fileUrl, fileName) => {
    try {
      const match = fileUrl.match(/\/api\/projects\/([^/]+)\/documents\/([^/]+)\/download/)
      if (!match) throw new Error("Invalid download URL")
      const [, projectId, documentId] = match

      const response = await projectAPI.downloadDocument(projectId, documentId)
      const blob = new Blob([response.data], { type: "application/octet-stream" })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      alert("Failed to download document")
    }
  }

  // Add this function for viewing PDFs
  const viewDocument = async (fileUrl, fileName) => {
    try {
      const match = fileUrl.match(/\/api\/projects\/([^/]+)\/documents\/([^/]+)\/download/)
      if (!match) throw new Error("Invalid download URL")
      const [, projectId, documentId] = match

      const response = await projectAPI.downloadDocument(projectId, documentId)
      const blob = new Blob([response.data], { type: "application/pdf" })
      const url = window.URL.createObjectURL(blob)
      window.open(url, "_blank")
      setTimeout(() => window.URL.revokeObjectURL(url), 10000)
    } catch (error) {
      alert("Failed to view document")
    }
  }

  if (loading) {
    return <div className="loading">Loading project details...</div>
  }

  if (error && !project) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="error-container">
        <p>Project not found</p>
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!canViewProject()) {
    return (
      <div className="error-container">
        <p>You don't have permission to view this project</p>
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const isOverdue = new Date(project.deadline) < new Date() && project.status !== "completed"

  return (
    <div className="project-details">
      <div className="project-header">
        <button onClick={() => navigate("/dashboard")} className="back-btn">
          ← Back to Dashboard
        </button>
        <div className="header-content">
          <h1>{project.name}</h1>
          <span className={`status-badge ${project.status}`}>{project.status}</span>
        </div>
      </div>

      <div className="project-content">
        <div className="project-info">
          <div className="info-section">
            <h2>Project Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <strong>Description:</strong>
                <p>{project.description}</p>
              </div>
              <div className="info-item">
                <strong>Deadline:</strong>
                <p>
                  {formatDate(project.deadline)}
                  {isOverdue && <span className="overdue-text"> (Overdue)</span>}
                </p>
              </div>
              <div className="info-item">
                <strong>Priority:</strong>
                <p className={`priority-text ${project.priority}`}>{project.priority?.toUpperCase()}</p>
              </div>
              <div className="info-item">
                <strong>Project Lead:</strong>
                <p>{project.projectLead?.name || "Not assigned"}</p>
              </div>
              <div className="info-item">
                <strong>Created:</strong>
                <p>{formatDate(project.createdAt)}</p>
              </div>
              {project.estimatedHours && (
                <div className="info-item">
                  <strong>Estimated Hours:</strong>
                  <p>{project.estimatedHours}</p>
                </div>
              )}
              {project.actualHours && (
                <div className="info-item">
                  <strong>Actual Hours:</strong>
                  <p>{project.actualHours}</p>
                </div>
              )}
            </div>
          </div>

          <div className="info-section">
            <h2>Team Members</h2>
            <div className="team-list">
              {project.assignedDevelopers?.length > 0 ? (
                project.assignedDevelopers.map((dev) => (
                  <div key={dev._id || dev} className="team-member">
                    <span>{dev.name || dev}</span>
                    <span className="role">Developer</span>
                  </div>
                ))
              ) : (
                <p>No developers assigned</p>
              )}
            </div>
          </div>
        </div>

        <div className="documents-section">
          <div className="section-header">
            <h2>Project Documents</h2>
            <div className="document-actions">
              {canViewDocuments() && (
                <button onClick={fetchDocuments} className="view-docs-btn" disabled={documentsLoading}>
                  {documentsLoading ? "Loading..." : "View Documents"}
                </button>
              )}
              {canUploadDocuments() && (
                <button onClick={() => setShowUpload(!showUpload)} className="upload-btn">
                  Upload Document
                </button>
              )}
            </div>
          </div>

          {showUpload && <DocumentUpload onUpload={handleDocumentUpload} onCancel={() => setShowUpload(false)} />}

          {showDocuments && (
            <div className="documents-list">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <div key={doc._id} className="document-item">
                    <div className="document-info">
                      <h4>{doc.originalName}</h4>
                      <p>Uploaded: {formatDate(doc.createdAt)}</p>
                      <p>Size: {doc.sizeFormatted || `${(doc.size / 1024 / 1024).toFixed(2)} MB`}</p>
                      <p>Uploaded by: {doc.uploadedBy?.name}</p>
                      {doc.description && <p>Description: {doc.description}</p>}
                    </div>
                    <div className="document-actions">
                      <button onClick={() => downloadDocument(doc.downloadUrl, doc.originalName)} className="download-btn">
                        Download
                      </button>
                      {doc.mimetype === "application/pdf" && (
                        <button
                          onClick={() => viewDocument(doc.downloadUrl, doc.originalName)}
                          className="view-btn"
                        >
                          View
                        </button>
                      )}
                      {canUploadDocuments() && (
                        <button onClick={() => handleDocumentDelete(doc._id)} className="delete-btn">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p>No documents uploaded</p>
              )}
            </div>
          )}

          {error && showDocuments && <div className="error-message">{error}</div>}
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails
