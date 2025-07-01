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
    <div className="developer-dashboard min-h-screen bg-gray-50 p-6 md:p-8 lg:p-12">
      <div className="section-header mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">My Assigned Projects</h2>
        <p className="text-lg text-gray-600">
          Projects assigned to you: <span className="font-semibold text-indigo-600">{assignedProjects.length}</span>
        </p>
      </div>

      <div className="projects-grid">
        {assignedProjects.length > 0 ? (
          <div className="project-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignedProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                showDeveloperView={true}
                className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:shadow-xl"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto">
            <p className="text-lg text-gray-700 font-medium mb-2">No Projects Assigned</p>
            <p className="text-gray-500">
              You are not currently assigned to any projects. Please contact your project lead or admin for assignments.
            </p>
            <div className="mt-6">
              <a
                href="mailto:support@company.com"
                className="inline-block px-6 py-3 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-200"
              >
                Contact Admin
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeveloperDashboard