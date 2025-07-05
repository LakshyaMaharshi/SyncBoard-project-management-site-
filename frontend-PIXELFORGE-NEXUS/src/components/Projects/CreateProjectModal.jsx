"use client"

import { useState } from "react"
import { useSelector } from "react-redux"

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    projectLead: "",
    priority: "medium",
    estimatedHours: "",
    tags: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const { users } = useSelector((state) => state.users)
  const safeUsers = Array.isArray(users) ? users : []

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

    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      setError("Deadline must be in the future")
      setLoading(false)
      return
    }

    const projectData = {
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      priority: formData.priority,
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 mb-5">
          <h2 className="text-xl text-gray-800 font-medium">Create New Project</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800 w-[30px] h-[30px] flex items-center justify-center bg-transparent border-none cursor-pointer">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label htmlFor="name" className="block mb-1 font-medium text-gray-800">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter project name"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="description" className="block mb-1 font-medium text-gray-800">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              disabled={loading}
              placeholder="Enter project description"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors resize-y min-h-[80px]"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="deadline" className="block mb-1 font-medium text-gray-800">
              Deadline *
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              required
              disabled={loading}
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="projectLead" className="block mb-1 font-medium text-gray-800">
              Assign Project Lead
            </label>
            <select
              id="projectLead"
              name="projectLead"
              value={formData.projectLead}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="">Select a project lead (optional)</option>
              {projectLeads.map((lead) => (
                <option key={lead._id} value={lead._id}>
                  {lead.name} ({lead.email}) - {lead.role.replace("_", " ")}
                </option>
              ))}
            </select>
            <small className="text-gray-600 text-xs">
              Only users with Project Lead or Admin role can be assigned
            </small>
          </div>

          <div className="mb-5">
            <label htmlFor="priority" className="block mb-1 font-medium text-gray-800">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="mb-5">
            <label htmlFor="estimatedHours" className="block mb-1 font-medium text-gray-800">
              Estimated Hours
            </label>
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
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="tags" className="block mb-1 font-medium text-gray-800">
              Tags
            </label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              disabled={loading}
              placeholder="Enter tags separated by commas (e.g., web, mobile, api)"
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded-md border border-red-200 mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-5 max-[480px]:flex-col">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-400 text-white px-5 py-2 rounded-md text-sm hover:bg-gray-500 disabled:opacity-60 disabled:cursor-not-allowed max-[480px]:w-full transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-5 py-2 rounded-md text-sm hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed max-[480px]:w-full transition-colors"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateProjectModal