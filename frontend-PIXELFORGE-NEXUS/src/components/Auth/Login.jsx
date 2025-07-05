"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { loginUser, clearError } from "../../store/slices/authSlice"
import { useNavigate, Link } from "react-router-dom"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    mfaCode: "",
  })

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user, loading, error, requiresMFA } = useSelector((state) => state.auth)
  const [localOtpError, setLocalOtpError] = useState("")

  useEffect(() => {
    if (user) {
      navigate("/dashboard")
    }
  }, [user, navigate])

  useEffect(() => {
    dispatch(clearError())
  }, [dispatch])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    if (e.target.name === "mfaCode") setLocalOtpError("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalOtpError("")
    if (requiresMFA && !formData.mfaCode) {
      setLocalOtpError("Please enter the OTP sent to your email.")
      return
    }
    const payload = {
      email: formData.email,
      password: formData.password,
    }
    if (requiresMFA && formData.mfaCode) {
      payload.mfaCode = formData.mfaCode
    }
    const result = await dispatch(loginUser(payload))
    if (loginUser.fulfilled.match(result)) {
      navigate("/dashboard")
    }
  }

  useEffect(() => {
    if (requiresMFA) {
      setFormData((prev) => ({ ...prev, mfaCode: "" }))
    }
  }, [requiresMFA])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">PixelForge Nexus</h1>
          <h2 className="text-xl font-semibold text-gray-600 mt-2">Sign In</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
          </div>

          {requiresMFA && (
            <div>
              <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700">
                MFA Code
              </label>
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
                className="mt-1 block w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="text-blue-600 text-xs mt-2">MFA code sent to your email. Please enter it to continue.</div>
              {localOtpError && (
                <div className="text-red-600 text-xs mt-2">{localOtpError}</div>
              )}
            </div>
          )}

          {error && !requiresMFA && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need to create a company account?{" "}
            <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Company Registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login