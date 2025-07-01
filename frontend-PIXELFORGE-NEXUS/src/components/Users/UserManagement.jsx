"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { updateUser, deleteUser, fetchUsers } from "../../store/slices/userSlice"

const UserManagement = ({ users }) => {
  const safeUsers = Array.isArray(users) ? users : []
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const dispatch = useDispatch()

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
    setError("")
  }

  const handleUpdateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await dispatch(
      updateUser({
        id: editingUser._id,
        updates: {
          name: editingUser.name,
          email: editingUser.email,
          role: editingUser.role,
        },
      }),
    )

    if (updateUser.fulfilled.match(result)) {
      setEditingUser(null)
      dispatch(fetchUsers())
    } else {
      setError(result.payload || "Failed to update user")
    }

    setLoading(false)
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true)
      setError("")
      const result = await dispatch(deleteUser(userId))

      if (deleteUser.fulfilled.match(result)) {
        dispatch(fetchUsers())
      } else {
        setError(result.payload || "Failed to delete user")
      }

      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setEditingUser({
      ...editingUser,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">User Management</h2>

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {safeUsers.length === 0 ? (
          <p className="text-sm text-gray-600">No users available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-50 text-left text-sm font-medium text-gray-700">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {safeUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-50">
                    {editingUser && editingUser._id === user._id ? (
                      <>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            name="name"
                            value={editingUser.name}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="email"
                            name="email"
                            value={editingUser.email}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <select
                            name="role"
                            value={editingUser.role}
                            onChange={handleInputChange}
                            disabled={loading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                          >
                            <option value="developer">Developer</option>
                            <option value="project_lead">Project Lead</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 flex space-x-2">
                          <button
                            onClick={handleUpdateUser}
                            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            disabled={loading}
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            disabled={loading}
                          >
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${
                              user.role === "admin"
                                ? "bg-blue-600"
                                : user.role === "project_lead"
                                ? "bg-green-600"
                                : "bg-yellow-600"
                            }`}
                          >
                            {user.role.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                            disabled={loading}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id)}
                            className="px-3 py-1 text-red-600 hover:text-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                            disabled={loading}
                          >
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManagement