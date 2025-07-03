"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { assignDeveloper, removeDeveloper, uploadDocument, completeProject } from "../../store/slices/projectSlice"
import { fetchUsers } from "../../store/slices/userSlice"
import ProjectCard from "../Projects/ProjectCard"
import AssignDeveloperModal from "../Projects/AssignDeveloperModal"
import AllActiveProjects from "./AllActiveProjects"

const ProjectLeadDashboard = ({ projects, allActiveProjects }) => {
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [activeTab, setActiveTab] = useState("myprojects")

  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { users } = useSelector((state) => state.users)
  // console.log(users, "cdscsdc")

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  // Filter developers from users (already filtered by backend for project leads)
  const developers = users;
  console.log(developers)

  // Filter projects where user is the project lead
  const myProjects = (Array.isArray(projects) ? projects : []).filter(
    (project) => project.projectLead === user._id || project.projectLead?._id === user._id,
  )

  const handleAssignDeveloper = (project) => {
    setSelectedProject(project)
    setShowAssignModal(true)
  }

  const handleAssignSubmit = async (developerId) => {
    if (selectedProject) {
      const result = await dispatch(assignDeveloper({ projectId: selectedProject._id, developerId }))
      if (assignDeveloper.fulfilled.match(result)) {
        setShowAssignModal(false)
        setSelectedProject(null)
        return { success: true }
      }
      return { success: false, error: result.payload }
    }
  }

  const handleRemoveDeveloper = async (projectId, developerId) => {
    if (window.confirm("Are you sure you want to remove this developer from the project?")) {
      const result = await dispatch(removeDeveloper({ projectId, developerId }))
      return removeDeveloper.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
    }
    return { success: false }
  }

  const handleDocumentUpload = async (projectId, file) => {
    const result = await dispatch(uploadDocument({ projectId, file }))
    return uploadDocument.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
  }

  const handleCompleteProject = async (project) => {
    if (window.confirm("Are you sure you want to mark this project as completed?")) {
      const result = await dispatch(completeProject(project._id))
      return completeProject.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
    }
    return { success: false }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Project Dashboard</h1>
          <p className="text-gray-600">Manage and track your projects</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
              activeTab === "myprojects"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("myprojects")}
          >
            My Projects
            <span className="ml-2 px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
              {myProjects.length}
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors duration-200 ${
              activeTab === "all"
                ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
            onClick={() => setActiveTab("all")}
          >
            All Active Projects
          </button>
        </div>

        {/* Content */}
        {activeTab === "myprojects" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">My Projects</h2>
                <p className="text-gray-500 text-sm">Projects you are currently leading</p>
              </div>
              <div className="text-sm text-gray-500">
                Showing {myProjects.length} project{myProjects.length !== 1 ? 's' : ''}
              </div>
            </div>

            {myProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProjects.map((project) => (
                  <ProjectCard
                    key={project._id}
                    project={project}
                    onAssignDeveloper={() => handleAssignDeveloper(project)}
                    onRemoveDeveloper={handleRemoveDeveloper}
                    onDocumentUpload={handleDocumentUpload}
                    onCompleteProject={handleCompleteProject}
                    showLeadActions={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No projects assigned</h3>
                <p className="mt-1 text-sm text-gray-500">You are not currently leading any projects.</p>
                <p className="mt-1 text-sm text-gray-500">Contact your admin to be assigned as a project lead.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "all" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <AllActiveProjects allActiveProjects={allActiveProjects} />
          </div>
        )}

        {/* Assign Developer Modal */}
        {showAssignModal && selectedProject && (
          <AssignDeveloperModal
            project={selectedProject}
            developers={developers}
            onClose={() => {
              setShowAssignModal(false)
              setSelectedProject(null)
            }}
            onSubmit={handleAssignSubmit}
          />
        )}
      </div>
    </div>
  )
}

export default ProjectLeadDashboard