"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import "./Modal.css"

const EditProjectModal = ({ project, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: project?.name || "",
    description: project?.description || "",
    deadline: project?.deadline ? new Date(project.deadline).toISOString().split("T")[0] : "",
    projectLead: project?.projectLead?._id || project?.projectLead || "",
    priority: project?.priority || "medium",
    status: project?.status || "active",
    estimatedHours: project?.estimatedHours || "",
    actualHours: project?.actualHours || "",
    tags: project?.tags ? project.tags.join(", ") : "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { users } = useSelector((state) => state.users)
  const { user } = useSelector((state) => state.auth)

  // Filter users to get only project leads and admins for assignment
  const projectLeads = users.filter((user) => user.role === "project_lead" || user.role === "admin")

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

    // Validate deadline is in the future (only if status is not completed)
    if (formData.status !== "completed") {
      const deadlineDate = new Date(formData.deadline)
      if (deadlineDate <= new Date()) {
        setError("Deadline must be in the future for active projects")
        setLoading(false)
        return
      }
    }

    // Prepare update data
    const updateData = {
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      priority: formData.priority,
      status: formData.status,
    }

    // Add optional fields
    if (formData.projectLead) {
      updateData.projectLead = formData.projectLead
    }

    if (formData.estimatedHours) {
      updateData.estimatedHours = Number.parseInt(formData.estimatedHours)
    }

    if (formData.actualHours) {
      updateData.actualHours = Number.parseInt(formData.actualHours)
    }

    if (formData.tags) {
      updateData.tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag)
    }

    const result = await onSubmit(project._id, updateData)

    if (!result.success) {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Edit Project: {project?.name}</h2>
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
            />
          </div>

          {/* ✅ Project Lead Assignment (Admin only) */}
          {user?.role === "admin" && (
            <div className="form-group">
              <label htmlFor="projectLead">Project Lead</label>
              <select
                id="projectLead"
                name="projectLead"
                value={formData.projectLead}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">No project lead assigned</option>
                {projectLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name} ({lead.email}) - {lead.role.replace("_", " ")}
                  </option>
                ))}
              </select>
              <small style={{ color: "#666", fontSize: "12px" }}>
                ⚠️ Changing project lead will affect who can manage this project
              </small>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading}>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="actualHours">Actual Hours</label>
            <input
              type="number"
              id="actualHours"
              name="actualHours"
              value={formData.actualHours}
              onChange={handleChange}
              disabled={loading}
              min="0"
              max="10000"
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
              placeholder="Enter tags separated by commas"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProjectModal
