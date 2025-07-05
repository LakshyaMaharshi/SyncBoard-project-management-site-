"use client"

import ProjectCard from "../Projects/ProjectCard"

const AllActiveProjects = ({ allActiveProjects }) => {
  const safeAllActiveProjects = Array.isArray(allActiveProjects) ? allActiveProjects : []

  return (
    <div className="all-active-projects bg-gray-50 p-6 md:p-8 lg:p-12">
      <div className="section-header mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">All Active Projects</h2>
        <p className="text-lg text-gray-600">
          Active projects in the system: <span className="font-semibold text-indigo-600">{safeAllActiveProjects.length}</span>
        </p>
      </div>

      <div className="projects-grid">
        {safeAllActiveProjects.length > 0 ? (
          <div className="project-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeAllActiveProjects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                showViewOnly={true}
                className="bg-white shadow-lg rounded-lg overflow-hidden transform transition duration-300 hover:shadow-xl"
              />
            ))}
          </div>
        ) : (
          <div className="empty-state bg-white shadow-md rounded-lg p-8 text-center max-w-lg mx-auto">
            <p className="text-lg text-gray-700 font-medium mb-2">No Active Projects</p>
            <p className="text-gray-500">There are currently no active projects in the system.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AllActiveProjects