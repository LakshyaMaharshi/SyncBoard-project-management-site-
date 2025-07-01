"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { updatePassword, clearError, clearMessage } from "../../store/slices/authSlice"

const PasswordUpdate = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [localError, setLocalError] = useState("")

  const dispatch = useDispatch()
  const { loading, error, message } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setLocalError("") // Clear local error on input change
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    dispatch(clearError())
    dispatch(clearMessage())
    setLocalError("")

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setLocalError("New password and confirm password do not match")
      return
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
      setLocalError("New password must be at least 8 characters long")
      return
    }

    const result = await dispatch(
      updatePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      }),
    )

    if (updatePassword.fulfilled.match(result)) {
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Update Password</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="8"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="8"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
          />
        </div>

        {(error || localError) && (
          <div className="text-red-600 text-sm">{error || localError}</div>
        )}
        {message && <div className="text-green-600 text-sm">{message}</div>}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PasswordUpdate