"use client"
import { useSelector } from "react-redux"
import ProjectCard from "../Projects/ProjectCard"

// ✅ FIXED: Developers only see their assigned projects (no "All Active Projects" tab)
const DeveloperDashboard = ({ projects }) => {
  const { user } = useSelector((state) => state.auth)

  // Filter projects where user is assigned as a developer
  const assignedProjects = projects.filter((project) =>
    project.assignedDevelopers?.some((dev) => dev === user._id || dev._id === user._id),
  )

  return (
    <div className="developer-dashboard">
      <div className="section-header">
        <h2>My Assigned Projects</h2>
        <p>Projects assigned to you: {assignedProjects.length}</p>
      </div>

      <div className="projects-grid">
        <div className="project-cards">
          {assignedProjects.map((project) => (
            <ProjectCard key={project._id} project={project} showDeveloperView={true} />
          ))}
        </div>
      </div>

      {assignedProjects.length === 0 && (
        <div className="empty-state">
          <p>You are not currently assigned to any projects.</p>
          <p>Contact your project lead or admin for project assignments.</p>
        </div>
      )}
    </div>
  )
}

export default DeveloperDashboard
