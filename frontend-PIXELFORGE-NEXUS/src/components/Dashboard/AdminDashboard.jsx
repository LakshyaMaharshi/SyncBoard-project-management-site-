"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { createProject, updateProject, deleteProject, uploadDocument, completeProject } from "../../store/slices/projectSlice"
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

  const handleCompleteProject = async (project) => {
    if (window.confirm("Are you sure you want to mark this project as completed?")) {
      const result = await dispatch(completeProject(project._id))
      return completeProject.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
    }
    return { success: false }
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

  const activeProjects = safeProjects.filter((p) => p.status !== "completed")
  const completedProjects = safeProjects.filter((p) => p.status === "completed")

  const tabs = [
    { id: "projects", label: "My Projects", icon: "📋" },
    { id: "all", label: "All Active Projects", icon: "🏢" },
    { id: "users", label: "User Management", icon: "👥" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>Welcome back,</span>
                <span className="font-medium text-gray-900">Admin</span>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-2 mb-8 border border-gray-200/50 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-sm"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="text-sm">{tab.icon}</span>
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === "projects" && (
          <div className="space-y-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Project Management
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Manage your active and completed projects efficiently
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <span className="text-lg">+</span>
                    <span>Create New Project</span>
                  </button>
                  <Link
                    to="/register-team-member"
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span className="text-lg">👤</span>
                    <span>Register Team Member</span>
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {activeProjects.length}
                  </span>
                  <span>Active Projects</span>
                </h3>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span>Live Projects</span>
                </div>
              </div>

              {activeProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {activeProjects.map((project, index) => (
                    <div
                      key={project._id}
                      className="transform transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ProjectCard
                        project={project}
                        onEditProject={handleEditProject}
                        onCompleteProject={handleCompleteProject}
                        onDelete={handleDeleteProject}
                        onDocumentUpload={handleDocumentUpload}
                        showAdminActions={true}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">📋</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Active Projects</h4>
                  <p className="text-gray-600 mb-6">Create your first project to get started with project management.</p>
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Create New Project
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                  <span className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {completedProjects.length}
                  </span>
                  <span>Completed Projects</span>
                </h3>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Finished</span>
                </div>
              </div>

              {completedProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                  {completedProjects.map((project, index) => (
                    <div
                      key={project._id}
                      className="transform transition-all duration-300 hover:scale-105"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ProjectCard
                        project={project}
                        onEditProject={handleEditProject}
                        onCompleteProject={handleCompleteProject}
                        onDelete={handleDeleteProject}
                        onDocumentUpload={handleDocumentUpload}
                        showAdminActions={true}
                        className="bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-lg rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 h-full opacity-90"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-12 border border-gray-200/50 shadow-sm text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-400 to-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">✅</span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">No Completed Projects</h4>
                  <p className="text-gray-600">No projects have been marked as completed yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "all" && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
            <AllActiveProjects allActiveProjects={allActiveProjects} />
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    User Management
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Manage team members and user permissions
                  </p>
                </div>
                <Link
                  to="/register-team-member"
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <span className="text-lg">👤</span>
                  <span>Register Team Member</span>
                </Link>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-sm">
              <UserManagement users={users} />
            </div>
          </div>
        )}
      </div>

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