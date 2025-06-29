"use client"
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects, fetchAllActiveProjects } from "../../store/slices/projectSlice"
import AdminDashboard from "./AdminDashboard"
import ProjectLeadDashboard from "./ProjectLeadDashboard"
import DeveloperDashboard from "./DeveloperDashboard"
import "./Dashboard.css"

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { projects, allActiveProjects, loading } = useSelector((state) => state.projects)

  useEffect(() => {
    if (user) {
      dispatch(fetchProjects())
      dispatch(fetchAllActiveProjects())
    }
  }, [dispatch, user])

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case "admin":
        return <AdminDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      case "project_lead":
        return <ProjectLeadDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      case "developer":
        return <DeveloperDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      default:
        return <div>Invalid user role</div>
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Welcome, {user?.name}</h1>
        <p className="role-badge">{user?.role.replace("_", " ").toUpperCase()}</p>
      </div>

      {renderDashboard()}
    </div>
  )
}

export default Dashboard
