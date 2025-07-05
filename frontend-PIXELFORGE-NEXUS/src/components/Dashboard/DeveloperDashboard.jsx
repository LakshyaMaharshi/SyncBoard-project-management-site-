"use client"
import { useSelector } from "react-redux"
import ProjectCard from "../Projects/ProjectCard"

const DeveloperDashboard = ({ projects }) => {
  const { user } = useSelector((state) => state.auth)
  
  const assignedProjects = projects.filter((project) =>
    project.assignedDevelopers?.some((dev) => dev === user._id || dev._id === user._id)
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            My Assigned Projects
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Projects assigned to you: 
            <span className="font-semibold text-indigo-600"> {assignedProjects.length}</span>
          </p>
        </div>

        {assignedProjects.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {assignedProjects.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">
              No Projects Assigned
            </h3>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              You are not currently assigned to any projects. Please contact your project lead or admin for assignments.
            </p>
            <div className="mt-6">
              <a
                href="mailto:admin@company.com"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
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