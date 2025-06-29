"use client"
import { Link, useNavigate } from "react-router-dom"
import { useSelector, useDispatch } from "react-redux"
import { logout } from "../../store/slices/authSlice"
import "./Navbar.css"

const Navbar = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          PixelForge Nexus
        </Link>

        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-item">
            Dashboard
          </Link>

          {/* ✅ FIXED: Admin can register team members */}
          {user?.role === "admin" && (
            <Link
              to="/register-team-member"
              className="navbar-item"
              style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
            >
              Register Team Member
            </Link>
          )}

          <Link to="/settings" className="navbar-item">
            Settings
          </Link>

          <div className="navbar-user">
            <span className="user-info">
              {user?.name} ({user?.role?.replace("_", " ")})
            </span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
