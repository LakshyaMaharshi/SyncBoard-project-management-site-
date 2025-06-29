"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { registerUser, clearError, clearMessage } from "../../store/slices/authSlice"
import { useNavigate, Link } from "react-router-dom"
import "./Auth.css"

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    companyDescription: "",
    industry: "",
    companySize: "1-10",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, message, user } = useSelector((state) => state.auth)

  // Clear error and message when component mounts
  useEffect(() => {
    dispatch(clearError())
    dispatch(clearMessage())
  }, [dispatch])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      return
    }

    const result = await dispatch(
      registerUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        industry: formData.industry,
        companySize: formData.companySize,
      }),
    )

    if (registerUser.fulfilled.match(result)) {
      if (user) {
        // Auto-login successful, redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard")
        }, 1500)
      } else {
        // Manual login required, redirect to login
        setTimeout(() => {
          navigate("/login")
        }, 2000)
      }
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>PixelForge Nexus</h1>
          <h2>Create Your Company Account</h2>
          <p className="admin-only">You will become the admin of your company</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your company name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companyDescription">Company Description</label>
            <textarea
              id="companyDescription"
              name="companyDescription"
              value={formData.companyDescription}
              onChange={handleChange}
              disabled={loading}
              placeholder="Brief description of your company"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry</label>
            <input
              type="text"
              id="industry"
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              disabled={loading}
              placeholder="e.g., Technology, Healthcare, Finance"
            />
          </div>

          <div className="form-group">
            <label htmlFor="companySize">Company Size</label>
            <select
              id="companySize"
              name="companySize"
              value={formData.companySize}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-500">201-500 employees</option>
              <option value="500+">500+ employees</option>
            </select>
          </div>

          <hr style={{ margin: "20px 0", border: "1px solid #eee" }} />

          <div className="form-group">
            <label htmlFor="name">Your Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Your Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email address"
            />
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
              placeholder="Confirm your password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Creating Account..." : "Create Company Account"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
