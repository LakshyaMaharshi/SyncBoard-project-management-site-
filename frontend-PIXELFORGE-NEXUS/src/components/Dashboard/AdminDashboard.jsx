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
    <div className="admin-dashboard min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      <div className="dashboard-tabs flex flex-wrap gap-4 mb-8 border-b border-gray-200">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 ${
            activeTab === "projects"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("projects")}
        >
          My Projects
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 ${
            activeTab === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("all")}
        >
          All Active Projects
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors duration-200 ${
            activeTab === "users"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
          onClick={() => setActiveTab("users")}
        >
          User Management
        </button>
      </div>

      {activeTab === "projects" && (
        <div className="projects-section">
          <div className="section-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Project Management</h2>
              <p className="text-lg text-gray-600">
                Manage your active and completed projects
              </p>
            </div>
            <div className="flex gap-4">
              <button
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-200"
                onClick={() => setShowCreateModal(true)}
              >
                Create New Project
              </button>
              <Link
                to="/register-team-member"
                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition duration-200"
              >
                Register Team Member
              </Link>
            </div>
          </div>

          <div className="projects-grid space-y-12">
            <div className="project-section">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Active Projects ({activeProjects.length})
              </h3>
              {activeProjects.length > 0 ? (
                <div className="project-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeProjects.map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onEditProject={handleEditProject}
                      onMarkComplete={handleMarkComplete}
                      onDelete={handleDeleteProject}
                      onDocumentUpload={handleDocumentUpload}
                      showAdminActions={true}
                      className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:shadow-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto">
                  <p className="text-lg text-gray-700 font-medium mb-2">No Active Projects</p>
                  <p className="text-gray-500">Create a new project to get started.</p>
                </div>
              )}
            </div>

            <div className="project-section">
              <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                Completed Projects ({completedProjects.length})
              </h3>
              {completedProjects.length > 0 ? (
                <div className="project-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completedProjects.map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      onEditProject={handleEditProject}
                      onDelete={handleDeleteProject}
                      onDocumentUpload={handleDocumentUpload}
                      showAdminActions={true}
                      className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:shadow-xl"
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto">
                  <p className="text-lg text-gray-700 font-medium mb-2">No Completed Projects</p>
                  <p className="text-gray-500">No projects have been marked as completed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "all" && <AllActiveProjects allActiveProjects={allActiveProjects} />}

      {activeTab === "users" && (
        <div className="users-section">
          <div className="section-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">User Management</h2>
            <Link
              to="/register-team-member"
              className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700 transition duration-200"
            >
              Register Team Member
            </Link>
          </div>
          <UserManagement users={users} />
        </div>
      )}

      {showCreateModal && (
        <CreateProjectModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateProject} />
      )}

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