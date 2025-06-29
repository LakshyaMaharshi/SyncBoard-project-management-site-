"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import "./Modal.css"

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    projectLead: "", // ✅ Added project lead selection
    priority: "medium",
    estimatedHours: "",
    tags: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { users } = useSelector((state) => state.users)
  const safeUsers = Array.isArray(users) ? users : []

  // Filter users to get only project leads and admins for assignment
  const projectLeads = safeUsers.filter((user) => user.role === "project_lead" || user.role === "admin")

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validate deadline is in the future
    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future")
      setLoading(false)
      return
    }

    // Prepare project data
    const projectData = {
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      priority: formData.priority,
    }

    // Add optional fields
    if (formData.projectLead) {
      projectData.projectLead = formData.projectLead
    }

    if (formData.estimatedHours) {
      projectData.estimatedHours = Number.parseInt(formData.estimatedHours)
    }

    if (formData.tags) {
      projectData.tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    }

    const result = await onSubmit(projectData)

    if (!result.success) {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter project name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              disabled={loading}
              placeholder="Enter project description"
            />
          </div>

          <div className="form-group">
            <label htmlFor="deadline">Deadline *</label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              disabled={loading}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          {/* ✅ NEW: Project Lead Selection */}
          <div className="form-group">
            <label htmlFor="projectLead">Assign Project Lead</label>
            <select
              id="projectLead"
              name="projectLead"
              value={formData.projectLead}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select a project lead (optional)</option>
              {projectLeads.map((lead) => (
                <option key={lead._id} value={lead._id}>
                  {lead.name} ({lead.email}) - {lead.role.replace("_", " ")}
                </option>
              ))}
            </select>
            <small style={{ color: "#666", fontSize: "12px" }}>
              Only users with Project Lead or Admin role can be assigned
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={formData.priority} onChange={handleChange} disabled={loading}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="estimatedHours">Estimated Hours</label>
            <input
              type="number"
              id="estimatedHours"
              name="estimatedHours"
              value={formData.estimatedHours}
              onChange={handleChange}
              disabled={loading}
              min="1"
              max="10000"
              placeholder="Enter estimated hours"
            />
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter tags separated by commas (e.g., web, mobile, api)"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal
