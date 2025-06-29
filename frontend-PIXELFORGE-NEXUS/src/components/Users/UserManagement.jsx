"use client"

import { useState } from "react"
import { useDispatch } from "react-redux"
import { updateUser, deleteUser, fetchUsers } from "../../store/slices/userSlice"
import "./UserManagement.css"

const UserManagement = ({ users }) => {
  const safeUsers = Array.isArray(users) ? users : []
  const [editingUser, setEditingUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const dispatch = useDispatch()

  const handleEditUser = (user) => {
    setEditingUser({ ...user })
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
      dispatch(fetchUsers()) // Refresh users list
    } else {
      setError(result.payload || "Failed to update user")
    }

    setLoading(false)
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setLoading(true)
      const result = await dispatch(deleteUser(userId))

      if (deleteUser.fulfilled.match(result)) {
        dispatch(fetchUsers()) // Refresh users list
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
    <div className="user-management">
      <h2>User Management</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {safeUsers.map((user) => (
              <tr key={user._id}>
                {editingUser && editingUser._id === user._id ? (
                  <>
                    <td>
                      <input
                        type="text"
                        name="name"
                        value={editingUser.name}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <input
                        type="email"
                        name="email"
                        value={editingUser.email}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </td>
                    <td>
                      <select name="role" value={editingUser.role} onChange={handleInputChange} disabled={loading}>
                        <option value="developer">Developer</option>
                        <option value="project_lead">Project Lead</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={handleUpdateUser} className="save-btn" disabled={loading}>
                        Save
                      </button>
                      <button onClick={() => setEditingUser(null)} className="cancel-btn" disabled={loading}>
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role}`}>{user.role.replace("_", " ")}</span>
                    </td>
                    <td>
                      <button onClick={() => handleEditUser(user)} className="edit-btn" disabled={loading}>
                        Edit
                      </button>
                      <button onClick={() => handleDeleteUser(user._id)} className="delete-btn" disabled={loading}>
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
    </div>
  )
}

export default UserManagement
