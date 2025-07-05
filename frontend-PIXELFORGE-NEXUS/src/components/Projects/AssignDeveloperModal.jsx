"use client"

import { useState } from "react"

const AssignDeveloperModal = ({ project, developers, onClose, onSubmit }) => {
  const [selectedDeveloper, setSelectedDeveloper] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[1000]">
      <div className="bg-white rounded-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] w-[90%] max-w-[500px] max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-5 border-b border-gray-200 mb-5">
          <h2 className="text-xl text-gray-800 font-medium">Assign Developer to {project.name}</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-800 w-[30px] h-[30px] flex items-center justify-center bg-transparent border-none cursor-pointer">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="mb-5">
            <label htmlFor="developer" className="block mb-1 font-medium text-gray-800">
              Select Developer
            </label>
            <select
              id="developer"
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              required
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
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
            <p className="bg-blue-50 text-blue-700 p-2 rounded-md border border-blue-200 mb-4 text-sm">
              All available developers are already assigned to this project.
            </p>
          )}

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
              disabled={loading || availableDevelopers.length === 0}
            >
              {loading ? "Assigning..." : "Assign Developer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AssignDeveloperModal