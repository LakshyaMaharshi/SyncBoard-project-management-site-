"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { projectAPI } from "../services/api"
import { useAuth } from "./AuthContext"

const ProjectContext = createContext()

export const useProjects = () => {
  const context = useContext(ProjectContext)
  if (!context) {
    throw new Error("useProjects must be used within a ProjectProvider")
  }
  return context
}

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([])
  const [allActiveProjects, setAllActiveProjects] = useState([]) // ✅ NEW: All active projects
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchProjects()
      fetchAllActiveProjects() // ✅ NEW: Fetch all active projects
    }
  }, [user])

  const fetchProjects = async () => {
    setLoading(true)
    try {
      const response = await projectAPI.getProjects()
      setProjects(response.data)
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  // ✅ NEW: Fetch all active projects for all users
  const fetchAllActiveProjects = async () => {
    try {
      const response = await projectAPI.getAllActiveProjects()
      setAllActiveProjects(response.data)
    } catch (error) {
      console.error("Failed to fetch all active projects:", error)
    }
  }

  const createProject = async (projectData) => {
    try {
      const response = await projectAPI.createProject(projectData)
      setProjects((prev) => [...prev, response.data])
      // Refresh all active projects list
      fetchAllActiveProjects()
      return { success: true, project: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to create project",
      }
    }
  }

  const updateProject = async (projectId, updates) => {
    try {
      const response = await projectAPI.updateProject(projectId, updates)
      setProjects((prev) => prev.map((project) => (project._id === projectId ? response.data : project)))
      // Refresh all active projects list
      fetchAllActiveProjects()
      return { success: true, project: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to update project",
      }
    }
  }

  const deleteProject = async (projectId) => {
    try {
      await projectAPI.deleteProject(projectId)
      setProjects((prev) => prev.filter((project) => project._id !== projectId))
      // Refresh all active projects list
      fetchAllActiveProjects()
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete project",
      }
    }
  }

  const assignDeveloper = async (projectId, developerId) => {
    try {
      const response = await projectAPI.assignDeveloper(projectId, developerId)
      setProjects((prev) => prev.map((project) => (project._id === projectId ? response.data : project)))
      // Refresh all active projects list
      fetchAllActiveProjects()
      return { success: true, project: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to assign developer",
      }
    }
  }

  const removeDeveloper = async (projectId, developerId) => {
    try {
      const response = await projectAPI.removeDeveloper(projectId, developerId)
      setProjects((prev) => prev.map((project) => (project._id === projectId ? response.data : project)))
      // Refresh all active projects list
      fetchAllActiveProjects()
      return { success: true, project: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to remove developer",
      }
    }
  }

  const uploadDocument = async (projectId, file) => {
    try {
      const formData = new FormData()
      formData.append("document", file)

      const response = await projectAPI.uploadDocument(projectId, formData)

      // Update the project with new document
      setProjects((prev) =>
        prev.map((project) =>
          project._id === projectId
            ? { ...project, documents: [...(project.documents || []), response.data] }
            : project,
        ),
      )

      return { success: true, document: response.data }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to upload document",
      }
    }
  }

  const deleteDocument = async (projectId, documentId) => {
    try {
      await projectAPI.deleteDocument(projectId, documentId)

      // Update the project by removing the document
      setProjects((prev) =>
        prev.map((project) =>
          project._id === projectId
            ? {
                ...project,
                documents: project.documents?.filter((doc) => doc._id !== documentId) || [],
              }
            : project,
        ),
      )

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || "Failed to delete document",
      }
    }
  }

  const value = {
    projects,
    allActiveProjects, // ✅ NEW: Expose all active projects
    loading,
    fetchProjects,
    fetchAllActiveProjects, // ✅ NEW: Expose refresh function
    createProject,
    updateProject,
    deleteProject,
    assignDeveloper,
    removeDeveloper,
    uploadDocument,
    deleteDocument,
  }

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
}
