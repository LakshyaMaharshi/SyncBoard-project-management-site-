"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { createProject, updateProject, deleteProject, uploadDocument } from "../../store/slices/projectSlice"
import { fetchUsers } from "../../store/slices/userSlice"
import ProjectCard from "../Projects/ProjectCard"
import CreateProjectModal from "../Projects/CreateProjectModal"
import EditProjectModal from "../Projects/EditProjectModal"
import UserManagement from "../Users/UserManagement"
import AllActiveProjects from "./AllActiveProjects"
import { Link } from "react-router-dom"

const AdminDashboard = ({ projects, allActiveProjects }) => {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeTab, setActiveTab] = useState("projects")

  const dispatch = useDispatch()
  const { users } = useSelector((state) => state.users)

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  const handleCreateProject = async (projectData) => {
    const result = await dispatch(createProject(projectData))
    if (createProject.fulfilled.match(result)) {
      setShowCreateModal(false)
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  // ✅ NEW: Handle project edit
  const handleEditProject = (project) => {
    setSelectedProject(project)
    setShowEditModal(true)
  }

  const handleUpdateProject = async (projectId, updateData) => {
    const result = await dispatch(updateProject({ id: projectId, updates: updateData }))
    if (updateProject.fulfilled.match(result)) {
      setShowEditModal(false)
      setSelectedProject(null)
      return { success: true }
    }
    return { success: false, error: result.payload }
  }

  const handleMarkComplete = async (projectId) => {
    const result = await dispatch(updateProject({ id: projectId, updates: { status: "completed" } }))
    return updateProject.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
  }

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      const result = await dispatch(deleteProject(projectId))
      return deleteProject.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
    }
    return { success: false }
  }

  const handleDocumentUpload = async (projectId, file) => {
    const result = await dispatch(uploadDocument({ projectId, file }))
    return uploadDocument.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
  }

  const safeProjects = Array.isArray(projects) ? projects : []
  const safeAllActiveProjects = Array.isArray(allActiveProjects) ? allActiveProjects : []

  const activeProjects = safeProjects.filter((p) => p.status !== "completed")
  const completedProjects = safeProjects.filter((p) => p.status === "completed")

  return (
    
    <div className="admin-dashboard">
      <div className="dashboard-tabs">
        <button className={`tab ${activeTab === "projects" ? "active" : ""}`} onClick={() => setActiveTab("projects")}>
          My Projects
        </button>
        <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          All Active Projects
        </button>
        <button className={`tab ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          User Management
        </button>
      </div>

      {activeTab === "projects" && (
        <div className="projects-section">
          <div className="section-header">
            <h2>Project Management</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="create-button" onClick={() => setShowCreateModal(true)}>
                Create New Project
              </button>
              <Link
                to="/register-team-member"
                className="create-button"
                style={{ textDecoration: "none", display: "inline-block" }}
              >
                Register Team Member
              </Link>
            </div>
          </div>

          <div className="projects-grid">
            <div className="project-section">
              <h3>Active Projects ({activeProjects.length})</h3>
              <div className="project-cards">
                {activeProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onEditProject={handleEditProject}
                    onMarkComplete={handleMarkComplete}
                    onDelete={handleDeleteProject}
                    onDocumentUpload={handleDocumentUpload}
                    showAdminActions={true}
                  />
                ))}
              </div>
            </div>

            <div className="project-section">
              <h3>Completed Projects ({completedProjects.length})</h3>
              <div className="project-cards">
                {completedProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onEditProject={handleEditProject}
                    onDelete={handleDeleteProject}
                    onDocumentUpload={handleDocumentUpload}
                    showAdminActions={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "all" && <AllActiveProjects allActiveProjects={allActiveProjects} />}

      {activeTab === "users" && (
        <div>
          <div className="section-header">
            <h2>User Management</h2>
            <Link
              to="/register-team-member"
              className="create-button"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              Register Team Member
            </Link>
          </div>
          <UserManagement users={users} />
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateProject} />
      )}

      {/* ✅ NEW: Edit Project Modal */}
      {showEditModal && selectedProject && (
        <EditProjectModal
          project={selectedProject}
          onClose={() => {
            setShowEditModal(false)
            setSelectedProject(null)
          }}
          onSubmit={handleUpdateProject}
        />
      )}
    </div>
  )
}

export default AdminDashboard
