"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authAPI } from "../services/api"

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mfaEnabled, setMfaEnabled] = useState(false)

  useEffect(() => {
    // Check if user is logged in on app start
    const token = localStorage.getItem("token")
    console.log("AuthProvider - Token found:", !!token)

    if (token) {
      // Verify token with backend
      verifyToken(token)
    } else {
      console.log("AuthProvider - No token found")
      setLoading(false)
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      console.log("AuthProvider - Verifying token...")
      const response = await authAPI.verifyToken(token)
      console.log("AuthProvider - Token verification successful:", response.data)
      setUser(response.data.user)
      setMfaEnabled(response.data.user.mfaEnabled || false)
    } catch (error) {
      console.error("AuthProvider - Token verification failed:", error)
      localStorage.removeItem("token")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, mfaCode = null) => {
    try {
      console.log("AuthProvider - Attempting login for:", email)
      const response = await authAPI.login({ email, password, mfaCode })
      const { token, user: userData } = response.data.data

      console.log("AuthProvider - Login successful:", userData)
      localStorage.setItem("token", token)
      setUser(userData)
      setMfaEnabled(userData.mfaEnabled || false)

      return { success: true }
    } catch (error) {
      console.error("AuthProvider - Login failed:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Login failed",
        requiresMFA: error.response?.data?.requiresMFA || false,
      }
    }
  }

  const register = async (userData) => {
    try {
      console.log("AuthProvider - Attempting registration:", userData)
      const response = await authAPI.register(userData)
      console.log("AuthProvider - Registration successful:", response.data)

      // ✅ NEW: Handle auto-login after registration
      if (response.data.data && response.data.data.token) {
        const { token, user: registeredUser } = response.data.data

        console.log("AuthProvider - Auto-login after registration:", registeredUser)
        localStorage.setItem("token", token)
        setUser(registeredUser)
        setMfaEnabled(registeredUser.mfaEnabled || false)

        return {
          success: true,
          message: "Registration successful! Welcome to PixelForge Nexus.",
          autoLogin: true,
        }
      }

      return { success: true, message: "User registered successfully" }
    } catch (error) {
      console.error("AuthProvider - Registration failed:", error)
      return {
        success: false,
        error: error.response?.data?.message || "Registration failed",
      }
    }
  }

  const logout = () => {
    console.log("AuthProvider - Logging out")
    localStorage.removeItem("token")
    setUser(null)
    setMfaEnabled(false)
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      await authAPI.updatePassword({ currentPassword, newPassword })
      return { success: true, message: "Password updated successfully" }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Password update failed",
      }
    }
  }

  const setupMFA = async () => {
    try {
      const response = await authAPI.setupMFA()
      return { success: true, qrCode: response.data.qrCode, secret: response.data.secret }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "MFA setup failed",
      }
    }
  }

  const enableMFA = async (token) => {
    try {
      await authAPI.enableMFA({ token })
      setMfaEnabled(true)
      setUser((prev) => ({ ...prev, mfaEnabled: true }))
      return { success: true, message: "MFA enabled successfully" }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "MFA enable failed",
      }
    }
  }

  const disableMFA = async (token) => {
    try {
      await authAPI.disableMFA({ token })
      setMfaEnabled(false)
      setUser((prev) => ({ ...prev, mfaEnabled: false }))
      return { success: true, message: "MFA disabled successfully" }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "MFA disable failed",
      }
    }
  }

  // Debug: Log current state
  console.log("AuthProvider - Current state:", { user, loading, mfaEnabled })

  const value = {
    user,
    loading,
    mfaEnabled,
    login,
    register,
    logout,
    updatePassword,
    setupMFA,
    enableMFA,
    disableMFA,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
