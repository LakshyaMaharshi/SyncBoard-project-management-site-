"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import DocumentUpload from "./DocumentUpload"

const ProjectCard = ({
  project,
  onAssignDeveloper,
  onRemoveDeveloper,
  onDocumentUpload,
  onEditProject,
  onCompleteProject,
  showAdminActions = false,
  showLeadActions = false,
  showDeveloperView = false,
}) => {
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [showUpload, setShowUpload] = useState(false)

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isOverdue = new Date(project.deadline) < new Date() && project.status !== "completed"

  const handleViewDetails = () => {
    navigate(`/projects/${project._id}`)
  }

  const handleDocumentUpload = async (file, description) => {
    if (onDocumentUpload) {
      const result = await onDocumentUpload(project._id, file, description)
      if (result.success) {
        setShowUpload(false)
      }
      return result
    }
  }

  const canUploadDocuments = () => {
    return (
      user?.role === "admin" ||
      (user?.role === "project_lead" && (project.projectLead === user._id || project.projectLead?._id === user._id))
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-md hover:shadow-lg transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
        <span
          className={`px-2 py-1 text-xs font-medium text-white rounded-full ${
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

      <div className="space-y-4">
        <p className="text-sm text-gray-600">{project.description}</p>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <strong className="text-sm font-medium text-gray-700">Deadline:</strong>
            <span className={`text-sm ${isOverdue ? "text-red-600" : "text-gray-600"}`}>
              {formatDate(project.deadline)}
              {isOverdue && " (Overdue)"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <strong className="text-sm font-medium text-gray-700">Priority:</strong>
            <span
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
            </span>
          </div>

          <div className="flex items-center justify-between">
            <strong className="text-sm font-medium text-gray-700">Project Lead:</strong>
            <span className="text-sm text-gray-600">{project.projectLead?.name || "Not assigned"}</span>
          </div>

          <div className="flex items-center justify-between">
            <strong className="text-sm font-medium text-gray-700">Developers:</strong>
            <span className="text-sm text-gray-600">{project.assignedDevelopers?.length || 0}</span>
          </div>

          {project.estimatedHours && (
            <div className="flex items-center justify-between">
              <strong className="text-sm font-medium text-gray-700">Estimated Hours:</strong>
              <span className="text-sm text-gray-600">{project.estimatedHours}</span>
            </div>
          )}
        </div>

        {project.assignedDevelopers?.length > 0 && (
          <div className="space-y-2">
            <strong className="text-sm font-medium text-gray-700">Team:</strong>
            <div className="flex flex-wrap gap-2">
              {project.assignedDevelopers.map((dev) => (
                <span
                  key={dev._id || dev}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                >
                  {dev.name || dev}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-6">
        <button
          onClick={handleViewDetails}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          View Details
        </button>

        {user?.role === "admin" && (
          <>
            <button
              onClick={() => onEditProject(project)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Edit
            </button>
            <button
              onClick={() => onAssignDeveloper(project)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Assign Developer
            </button>
            {project.status !== "completed" && (
              <button
                onClick={() => onCompleteProject(project)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Complete
              </button>
            )}
          </>
        )}

        {user?.role === "project_lead" &&
          (project.projectLead === user._id || project.projectLead?._id === user._id) && (
            <>
              <button
                onClick={() => onAssignDeveloper(project)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Assign Developer
              </button>
              {project.status !== "completed" && (
                <button
                  onClick={() => onCompleteProject(project)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Complete
                </button>
              )}
            </>
          )}

        {canUploadDocuments() && (
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Upload Document
          </button>
        )}
      </div>

      {showUpload && <DocumentUpload onUpload={handleDocumentUpload} onCancel={() => setShowUpload(false)} />}
    </div>
  )
}

export default ProjectCard