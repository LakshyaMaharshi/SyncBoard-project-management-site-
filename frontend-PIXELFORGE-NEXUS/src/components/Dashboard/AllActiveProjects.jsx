"use client"

import ProjectCard from "../Projects/ProjectCard"

// ✅ Component to display all active projects (read-only view for all users)
const AllActiveProjects = ({ allActiveProjects }) => {
  const safeAllActiveProjects = Array.isArray(allActiveProjects) ? allActiveProjects : []

  return (
    <div className="all-active-projects">
      <div className="section-header">
        <h2>All Active Projects</h2>
        <p>All active projects in the system: {safeAllActiveProjects.length}</p>
      </div>

      <div className="projects-grid">
        <div className="project-cards">
          {safeAllActiveProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              showViewOnly={true} // ✅ Read-only view for all users
            />
          ))}
        </div>
      </div>

      {safeAllActiveProjects.length === 0 && (
        <div className="empty-state">
          <p>No active projects found.</p>
        </div>
      )}
    </div>
  )
}

export default AllActiveProjects
