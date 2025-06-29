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

  const dispatch = useDispatch()
  const { loading, error, message } = useSelector((state) => state.auth)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear previous messages
    dispatch(clearError())
    dispatch(clearMessage())

    // Validate passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      return
    }

    // Validate password strength
    if (formData.newPassword.length < 8) {
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
    <div className="password-update">
      <h3>Update Password</h3>

      <form onSubmit={handleSubmit} className="password-form">
        <div className="form-group">
          <label htmlFor="currentPassword">Current Password</label>
          <input
            type="password"
            id="currentPassword"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="8"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="8"
          />
        </div>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <button type="submit" className="update-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  )
}

export default PasswordUpdate
