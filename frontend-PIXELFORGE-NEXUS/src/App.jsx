"use client"

import { useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { verifyToken } from "./store/slices/authSlice"

// Components
import Navbar from "./components/Layout/Navbar"
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import RegisterTeamMember from "./components/Auth/RegisterTeamMember"
import Dashboard from "./components/Dashboard/Dashboard"
import ProjectDetails from "./components/Projects/ProjectDetails"
import UserManagement from "./components/Users/UserManagement"
import AccountSettings from "./components/Settings/AccountSettings"

// CSS
import "./App.css"

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated && !token) {
    return <Navigate to="/login" replace />
  }

  return children
}

// Public Route Component (redirect to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth)

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const dispatch = useDispatch()
  const { token, isAuthenticated } = useSelector((state) => state.auth)

  // Verify token on app load
  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(verifyToken(token))
    }
  }, [dispatch, token, isAuthenticated])

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/register-team-member"
            element={
              <ProtectedRoute>
                <Navbar />
                <RegisterTeamMember />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Navbar />
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects/:id"
            element={
              <ProtectedRoute>
                <Navbar />
                <ProjectDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Navbar />
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Navbar />
                <AccountSettings />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
