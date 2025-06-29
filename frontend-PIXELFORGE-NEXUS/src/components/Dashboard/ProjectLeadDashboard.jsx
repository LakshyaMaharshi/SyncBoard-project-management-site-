"use client"

import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { assignDeveloper, removeDeveloper, uploadDocument } from "../../store/slices/projectSlice"
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

  useEffect(() => {
    dispatch(fetchUsers())
  }, [dispatch])

  // Filter developers from users (same company only)
  const developers = users.filter((u) => u.role === "developer")

  // ✅ FIXED: Filter projects where user is the project lead

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

  // ✅ FIXED: Document upload for project leads
  const handleDocumentUpload = async (projectId, file) => {
    const result = await dispatch(uploadDocument({ projectId, file }))
    return uploadDocument.fulfilled.match(result) ? { success: true } : { success: false, error: result.payload }
  }

  return (
    <div className="project-lead-dashboard">
      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "myprojects" ? "active" : ""}`}
          onClick={() => setActiveTab("myprojects")}
        >
          My Projects
        </button>
        <button className={`tab ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          All Active Projects
        </button>
      </div>

      {activeTab === "myprojects" && (
        <div>
          <div className="section-header">
            <h2>My Projects</h2>
            <p>Projects you are leading: {myProjects.length}</p>
          </div>

          <div className="projects-grid">
            <div className="project-cards">
              {myProjects.map((project) => (
                // console.log(project),
                <ProjectCard
                  key={project._id}
                  project={project}
                  onAssignDeveloper={() => handleAssignDeveloper(project)}
                  onRemoveDeveloper={handleRemoveDeveloper}
                  onDocumentUpload={handleDocumentUpload} // ✅ FIXED: Document upload
                  showLeadActions={true}
                />
              ))}
            </div>
          </div>

          {myProjects.length === 0 && (
            <div className="empty-state">
              <p>You are not currently leading any projects.</p>
              <p>Contact your admin to be assigned as a project lead.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "all" && <AllActiveProjects allActiveProjects={allActiveProjects} />}

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
  )
}

export default ProjectLeadDashboard
