"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { loginUser, clearError } from "../../store/slices/authSlice"
import { useNavigate, Link } from "react-router-dom"
import "./Auth.css"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error, requiresMFA } = useSelector((state) => state.auth)

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  // Clear error when component mounts
  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const result = await dispatch(
      loginUser({
        email: formData.email,
        password: formData.password,
        mfaCode: requiresMFA ? formData.mfaCode : null,
      }),
    )

    if (loginUser.fulfilled.match(result)) {
      navigate("/dashboard")
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>PixelForge Nexus</h1>
          <h2>Sign In</h2>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          {requiresMFA && (
            <div className="form-group">
              <label htmlFor="mfaCode">MFA Code</label>
              <input
                type="text"
                id="mfaCode"
                name="mfaCode"
                value={formData.mfaCode}
                onChange={handleChange}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {/* ✅ FIXED: Link to company registration, not team member registration */}
            Need to create a company account? <Link to="/register">Company Registration</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
