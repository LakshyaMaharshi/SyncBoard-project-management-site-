"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSelector } from "react-redux"
import DocumentUpload from "./DocumentUpload"
import "./ProjectCard.css"

const ProjectCard = ({
  project,
  onAssignDeveloper,
  onRemoveDeveloper,
  onDocumentUpload,
  onEditProject,
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
    <div className="project-card">
      <div className="project-card-header">
        <h3 className="project-title">{project.name}</h3>
        <span className={`status-badge ${project.status}`}>{project.status}</span>
      </div>

      <div className="project-card-body">
        <p className="project-description">{project.description}</p>

        <div className="project-meta">
          <div className="meta-item">
            <strong>Deadline:</strong>
            <span className={isOverdue ? "overdue" : ""}>
              {formatDate(project.deadline)}
              {isOverdue && " (Overdue)"}
            </span>
          </div>

          <div className="meta-item">
            <strong>Priority:</strong>
            <span className={`priority ${project.priority}`}>{project.priority?.toUpperCase()}</span>
          </div>

          <div className="meta-item">
            <strong>Project Lead:</strong>
            <span>{project.projectLead?.name || "Not assigned"}</span>
          </div>

          <div className="meta-item">
            <strong>Developers:</strong>
            <span>{project.assignedDevelopers?.length || 0}</span>
          </div>

          {project.estimatedHours && (
            <div className="meta-item">
              <strong>Estimated Hours:</strong>
              <span>{project.estimatedHours}</span>
            </div>
          )}
        </div>

        <div className="project-team">
          {project.assignedDevelopers?.length > 0 && (
            <div className="team-members">
              <strong>Team:</strong>
              <div className="team-list">
                {project.assignedDevelopers.map((dev) => (
                  <span key={dev._id || dev} className="team-member">
                    {dev.name || dev}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="project-card-actions">
        <button onClick={handleViewDetails} className="btn btn-primary">
          View Details
        </button>

        {showAdminActions && (
          <>
            <button onClick={() => onEditProject(project)} className="btn btn-secondary">
              Edit
            </button>
            <button onClick={() => onAssignDeveloper(project)} className="btn btn-secondary">
              Assign Developer
            </button>
          </>
        )}

        {showLeadActions && (
          <>
            <button onClick={() => onAssignDeveloper(project)} className="btn btn-secondary">
              Assign Developer
            </button>
            {canUploadDocuments() && (
              <button onClick={() => setShowUpload(!showUpload)} className="btn btn-secondary">
                Upload Document
              </button>
            )}
          </>
        )}
      </div>

      {showUpload && <DocumentUpload onUpload={handleDocumentUpload} onCancel={() => setShowUpload(false)} />}
    </div>
  )
}

export default ProjectCard
