"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate, Link } from "react-router-dom"
import { authAPI } from "../../services/api"
import { fetchUsers } from "../../store/slices/userSlice"
import "./Auth.css"

const RegisterTeamMember = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "developer", // Default to developer
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  // Only admins can access this page
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/dashboard")
    }
  }, [user, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear errors when user starts typing
    if (error) setError("")
    if (success) setSuccess("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      setLoading(false)
      return
    }

    try {
      // Use the team member registration endpoint
      await authAPI.registerTeamMember({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      })

      setSuccess(`${formData.role.replace("_", " ")} registered successfully!`)

      // Refresh users list in Redux
      dispatch(fetchUsers())

      // Reset form
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "developer",
      })

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
    } catch (error) {
      setError(error.response?.data?.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  if (!user || user.role !== "admin") {
    return <div className="loading">Checking permissions...</div>
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>PixelForge Nexus</h1>
          <h2>Register Team Member</h2>
          <p className="admin-only">Admin Only - Add new team members</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role *</label>
            <select id="role" name="role" value={formData.role} onChange={handleChange} required disabled={loading}>
              <option value="developer">Developer</option>
              <option value="project_lead">Project Lead</option>
            </select>
            <small style={{ color: "#666", fontSize: "12px" }}>Select the role for this team member</small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="8"
              placeholder="Enter a strong password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
              minLength="8"
              placeholder="Confirm the password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Registering..." : "Register Team Member"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <Link to="/dashboard">← Back to Dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default RegisterTeamMember
