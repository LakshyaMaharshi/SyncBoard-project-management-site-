"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { projectAPI } from "../../services/api"
import DocumentUpload from "./DocumentUpload"
import EditProjectModal from "./EditProjectModal"
import AssignDeveloperModal from "./AssignDeveloperModal"
import { fetchUsers } from "../../store/slices/userSlice"

const ProjectDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { users } = useSelector((state) => state.users)
  const [project, setProject] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showDocuments, setShowDocuments] = useState(false)
  const [error, setError] = useState("")
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [removingDevId, setRemovingDevId] = useState(null)

  useEffect(() => {
    if (id) {
      fetchProject()
    }
    dispatch(fetchUsers())
  }, [id, dispatch])

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
        fetchDocuments()
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
        fetchDocuments()
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

  const handleEditProject = () => setShowEditModal(true)
  const handleAssignDeveloper = () => setShowAssignModal(true)
  const handleEditProjectSubmit = async (projectId, updateData) => {
    try {
      await projectAPI.updateProject(projectId, updateData)
      setShowEditModal(false)
      fetchProject()
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update project"
      return { success: false, error: errorMessage }
    }
  }
  const handleAssignDeveloperSubmit = async (developerId) => {
    setAssigning(true)
    try {
      await projectAPI.assignDeveloper(id, developerId)
      setShowAssignModal(false)
      fetchProject()
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to assign developer"
      return { success: false, error: errorMessage }
    } finally {
      setAssigning(false)
    }
  }
  const handleRemoveDeveloper = async (developerId) => {
    if (!window.confirm("Remove this developer from the project?")) return
    setRemovingDevId(developerId)
    try {
      await projectAPI.removeDeveloper(id, developerId)
      fetchProject()
    } catch (error) {
      alert("Failed to remove developer")
    } finally {
      setRemovingDevId(null)
    }
  }

  if (loading) {
    return <div className="text-center text-gray-600 text-lg">Loading project details...</div>
  }

  if (error && !project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-lg mb-4">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-lg mb-4">Project not found</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  if (!canViewProject()) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <p className="text-red-600 text-lg mb-4">You don't have permission to view this project</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const isOverdue = new Date(project.deadline) < new Date() && project.status !== "completed"

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
          >
            ← Back to Dashboard
          </button>
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-semibold text-gray-800">{project.name}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium text-white rounded-full ${
                project.status === "active"
                  ? "bg-green-600"
                  : project.status === "on_hold"
                  ? "bg-yellow-600"
                  : project.status === "completed"
                  ? "bg-blue-600"
                  : "bg-red-600"
              }`}
            >
              {project.status}
            </span>
          </div>
          <div className="flex space-x-3">
            {user?.role === "admin" && (
              <button
                onClick={handleEditProject}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Edit Project
              </button>
            )}
            {user?.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id) && (
              <button
                onClick={handleAssignDeveloper}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Manage Developers
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <strong className="text-sm font-medium text-gray-700">Description:</strong>
                <p className="text-sm text-gray-600">{project.description}</p>
              </div>
              <div>
                <strong className="text-sm font-medium text-gray-700">Deadline:</strong>
                <p className="text-sm text-gray-600">
                  {formatDate(project.deadline)}
                  {isOverdue && <span className="text-red-600"> (Overdue)</span>}
                </p>
              </div>
              <div>
                <strong className="text-sm font-medium text-gray-700">Priority:</strong>
                <p
                  className={`text-sm font-medium ${
                    project.priority === "low"
                      ? "text-green-600"
                      : project.priority === "medium"
                      ? "text-yellow-600"
                      : project.priority === "high"
                      ? "text-orange-600"
                      : "text-red-600"
                  }`}
                >
                  {project.priority?.toUpperCase()}
                </p>
              </div>
              <div>
                <strong className="text-sm font-medium text-gray-700">Project Lead:</strong>
                <p className="text-sm text-gray-600">{project.projectLead?.name || "Not assigned"}</p>
              </div>
              <div>
                <strong className="text-sm font-medium text-gray-700">Created:</strong>
                <p className="text-sm text-gray-600">{formatDate(project.createdAt)}</p>
              </div>
              {project.estimatedHours && (
                <div>
                  <strong className="text-sm font-medium text-gray-700">Estimated Hours:</strong>
                  <p className="text-sm text-gray-600">{project.estimatedHours}</p>
                </div>
              )}
              {project.actualHours && (
                <div>
                  <strong className="text-sm font-medium text-gray-700">Actual Hours:</strong>
                  <p className="text-sm text-gray-600">{project.actualHours}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Team Members</h2>
            <div className="space-y-2">
              {project.assignedDevelopers?.length > 0 ? (
                project.assignedDevelopers.map((dev) => (
                  <div key={dev._id || dev} className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{dev.name || dev}</span>
                      <span className="text-xs text-gray-500">Developer</span>
                    </div>
                    {user?.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id) && (
                      <button
                        onClick={() => handleRemoveDeveloper(dev._id || dev)}
                        disabled={removingDevId === (dev._id || dev)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                      >
                        {removingDevId === (dev._id || dev) ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600">No developers assigned</p>
              )}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Project Documents</h2>
              <div className="flex space-x-3">
                {canViewDocuments() && (
                  <button
                    onClick={fetchDocuments}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={documentsLoading}
                  >
                    {documentsLoading ? "Loading..." : "View Documents"}
                  </button>
                )}
                {canUploadDocuments() && (
                  <button
                    onClick={() => setShowUpload(!showUpload)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    Upload Document
                  </button>
                )}
              </div>
            </div>

            {showUpload && <DocumentUpload onUpload={handleDocumentUpload} onCancel={() => setShowUpload(false)} />}

            {showDocuments && (
              <div className="space-y-4">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc._id} className="flex items-center justify-between py-3 border-b border-gray-200">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium text-gray-800">{doc.originalName}</h4>
                        <p className="text-xs text-gray-500">Uploaded: {formatDate(doc.createdAt)}</p>
                        <p className="text-xs text-gray-500">
                          Size: {doc.sizeFormatted || `${(doc.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                        <p className="text-xs text-gray-500">Uploaded by: {doc.uploadedBy?.name}</p>
                        {doc.description && <p className="text-xs text-gray-500">Description: {doc.description}</p>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => downloadDocument(doc.downloadUrl, doc.originalName)}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                        >
                          Download
                        </button>
                        {doc.mimetype === "application/pdf" && (
                          <button
                            onClick={() => viewDocument(doc.downloadUrl, doc.originalName)}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            View
                          </button>
                        )}
                        {canUploadDocuments() && (
                          <button
                            onClick={() => handleDocumentDelete(doc._id)}
                            className="px-3 py-1 text-red-600 hover:text-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">No documents uploaded</p>
                )}
              </div>
            )}

            {error && showDocuments && <div className="text-red-600 text-sm mt-4">{error}</div>}
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditProjectSubmit}
        />
      )}
      {showAssignModal && (
        <AssignDeveloperModal
          project={project}
          developers={users.filter((u) => u.role === "developer")}
          onClose={() => setShowAssignModal(false)}
          onSubmit={handleAssignDeveloperSubmit}
        />
      )}
    </div>
  )
}

export default ProjectDetails