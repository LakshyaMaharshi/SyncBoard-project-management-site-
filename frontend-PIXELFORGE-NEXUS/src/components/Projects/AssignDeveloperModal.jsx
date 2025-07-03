"use client"

import { useState } from "react"
import "./Modal.css"

const AssignDeveloperModal = ({ project, developers, onClose, onSubmit }) => {
  const [selectedDeveloper, setSelectedDeveloper] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Filter out developers already assigned to the project
  const assignedDevIds = project.assignedDevelopers?.map((dev) => dev._id || dev) || []
  const availableDevelopers = developers.filter((dev) => !assignedDevIds.includes(dev._id))
  console.log(project)
  console.log(assignedDevIds)
  console.log(availableDevelopers)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedDeveloper) {
      setError("Please select a developer")
      return
    }

    setLoading(true)
    setError("")

    const result = await onSubmit(selectedDeveloper)

    if (!result.success) {
      setError(result.error)
    }

    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Assign Developer to {project.name}</h2>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="developer">Select Developer</label>
            <select
              id="developer"
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              required
              disabled={loading}
            >
              <option value="">Choose a developer...</option>
              {availableDevelopers.map((dev) => (
                <option key={dev._id} value={dev._id}>
                  {dev.name} ({dev.email})
                </option>
              ))}
            </select>
          </div>

          {availableDevelopers.length === 0 && (
            <p className="info-message">All available developers are already assigned to this project.</p>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading || availableDevelopers.length === 0}>
              {loading ? "Assigning..." : "Assign Developer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignDeveloperModal
