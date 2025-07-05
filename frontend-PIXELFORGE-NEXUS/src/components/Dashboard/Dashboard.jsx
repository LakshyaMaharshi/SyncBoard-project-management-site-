"use client"
import { useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { fetchProjects, fetchAllActiveProjects } from "../../store/slices/projectSlice"
import AdminDashboard from "./AdminDashboard"
import ProjectLeadDashboard from "./ProjectLeadDashboard"
import DeveloperDashboard from "./DeveloperDashboard"

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { projects, allActiveProjects, loading } = useSelector((state) => state.projects)

  useEffect(() => {
    if (user) {
      dispatch(fetchProjects())
      dispatch(fetchAllActiveProjects())
    }
  }, [dispatch, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg
            className="animate-spin h-10 w-10 text-indigo-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600 font-medium">
            Loading dashboard...
          </p>
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (user?.role) {
      case "admin":
        return <AdminDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      case "project_lead":
        return <ProjectLeadDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      case "developer":
        return <DeveloperDashboard projects={projects || []} allActiveProjects={allActiveProjects || []} />
      default:
        return (
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
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-medium text-gray-900">
              Invalid User Role
            </h3>
            <p className="mt-2 text-gray-600 max-w-md mx-auto">
              Your account role is not recognized. Please contact support for assistance.
            </p>
            <div className="mt-6">
              <a
                href="mailto:support@company.com"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Contact Support
              </a>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Welcome, {user?.name || "User"}
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Your Dashboard
            </p>
          </div>
          <span className="mt-4 sm:mt-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize">
            {user?.role?.replace("_", " ") || "Unknown Role"}
          </span>
        </div>

        {renderDashboard()}
      </div>
    </div>
  )
}

export default Dashboard