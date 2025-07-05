"use client"

import { useState } from "react"
import { useSelector } from "react-redux"

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

    if (formData.status !== "completed") {
      const deadlineDate = new Date(formData.deadline)
      if (deadlineDate <= new Date()) {
        setError("Deadline must be in the future for active projects")
        setLoading(false)
        return
      }
    }

    const updateData = {
      name: formData.name,
      description: formData.description,
      deadline: formData.deadline,
      priority: formData.priority,
      status: formData.status,
    }

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 mb-5">
          <h2 className="text-xl text-gray-800 font-medium">Edit Project: {project?.name}</h2>
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
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          {user?.role === "admin" && (
            <div className="mb-5">
              <label htmlFor="projectLead" className="block mb-1 font-medium text-gray-800">
                Project Lead
              </label>
              <select
                id="projectLead"
                name="projectLead"
                value={formData.projectLead}
                onChange={handleChange}
                disabled={loading}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="">No project lead assigned</option>
                {projectLeads.map((lead) => (
                  <option key={lead._id} value={lead._id}>
                    {lead.name} ({lead.email}) - {lead.role.replace("_", " ")}
                  </option>
                ))}
              </select>
              <small className="text-gray-600 text-xs">
                ⚠️ Changing project lead will affect who can manage this project
              </small>
            </div>
          )}

          <div className="mb-5">
            <label htmlFor="status" className="block mb-1 font-medium text-gray-800">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            />
          </div>

          <div className="mb-5">
            <label htmlFor="actualHours" className="block mb-1 font-medium text-gray-800">
              Actual Hours
            </label>
            <input
              type="number"
              id="actualHours"
              name="actualHours"
              value={formData.actualHours}
              onChange={handleChange}
              disabled={loading}
              min="0"
              max="10000"
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
              placeholder="Enter tags separated by commas"
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
              {loading ? "Updating..." : "Update Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProjectModal