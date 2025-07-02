import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { projectAPI } from "../../services/api"

// Async thunks
export const fetchProjects = createAsyncThunk("projects/fetchProjects", async (_, { rejectWithValue }) => {
  try {
    const response = await projectAPI.getProjects()
    return response.data.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch projects")
  }
})

export const fetchAllActiveProjects = createAsyncThunk(
  "projects/fetchAllActiveProjects",
  async (_, { rejectWithValue }) => {
    try {
      const response = await projectAPI.getAllActiveProjects()
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch all active projects")
    }
  },
)

export const createProject = createAsyncThunk("projects/createProject", async (projectData, { rejectWithValue }) => {
  try {
    const response = await projectAPI.createProject(projectData)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to create project")
  }
})

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await projectAPI.updateProject(id, updates)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update project")
    }
  },
)

export const deleteProject = createAsyncThunk("projects/deleteProject", async (projectId, { rejectWithValue }) => {
  try {
    await projectAPI.deleteProject(projectId)
    return projectId
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete project")
  }
})

export const assignDeveloper = createAsyncThunk(
  "projects/assignDeveloper",
  async ({ projectId, developerId }, { rejectWithValue }) => {
    try {
      const response = await projectAPI.assignDeveloper(projectId, developerId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to assign developer")
    }
  },
)

export const removeDeveloper = createAsyncThunk(
  "projects/removeDeveloper",
  async ({ projectId, developerId }, { rejectWithValue }) => {
    try {
      const response = await projectAPI.removeDeveloper(projectId, developerId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to remove developer")
    }
  },
)

export const uploadDocument = createAsyncThunk(
  "projects/uploadDocument",
  async ({ projectId, file }, { rejectWithValue }) => {
    try {
      const formData = new FormData()
      formData.append("document", file)
      const response = await projectAPI.uploadDocument(projectId, formData)
      return { projectId, document: response.data }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to upload document")
    }
  },
)

export const deleteDocument = createAsyncThunk(
  "projects/deleteDocument",
  async ({ projectId, documentId }, { rejectWithValue }) => {
    try {
      await projectAPI.deleteDocument(projectId, documentId)
      return { projectId, documentId }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete document")
    }
  },
)

export const completeProject = createAsyncThunk(
  "projects/completeProject",
  async (projectId, { rejectWithValue }) => {
    try {
      const response = await projectAPI.completeProject(projectId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to complete project")
    }
  },
)

const initialState = {
  projects: [],
  allActiveProjects: [],
  loading: false,
  error: null,
  message: null,
}

const projectSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearMessage: (state) => {
      state.message = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false
        state.projects = Array.isArray(action.payload) ? action.payload : []
        state.error = null
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch All Active Projects
      .addCase(fetchAllActiveProjects.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllActiveProjects.fulfilled, (state, action) => {
        state.loading = false
        state.allActiveProjects = Array.isArray(action.payload) ? action.payload : []
        state.error = null
      })
      .addCase(fetchAllActiveProjects.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create Project
      .addCase(createProject.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false
        state.projects.push(action.payload)
        state.message = "Project created successfully"
        state.error = null
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Update Project
      .addCase(updateProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        state.message = "Project updated successfully"
      })

      // Delete Project
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.projects = state.projects.filter((p) => p._id !== action.payload)
        state.allActiveProjects = state.allActiveProjects.filter((p) => p._id !== action.payload)
        state.message = "Project deleted successfully"
      })

      // Assign Developer
      .addCase(assignDeveloper.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        state.message = "Developer assigned successfully"
      })

      // Remove Developer
      .addCase(removeDeveloper.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        state.message = "Developer removed successfully"
      })

      // Upload Document
      .addCase(uploadDocument.fulfilled, (state, action) => {
        const { projectId, document } = action.payload
        const project = state.projects.find((p) => p._id === projectId)
        if (project) {
          project.documents = project.documents || []
          project.documents.push(document)
        }
        state.message = "Document uploaded successfully"
      })

      // Delete Document
      .addCase(deleteDocument.fulfilled, (state, action) => {
        const { projectId, documentId } = action.payload
        const project = state.projects.find((p) => p._id === projectId)
        if (project && project.documents) {
          project.documents = project.documents.filter((doc) => doc._id !== documentId)
        }
        state.message = "Document deleted successfully"
      })

      // Complete Project
      .addCase(completeProject.fulfilled, (state, action) => {
        const index = state.projects.findIndex((p) => p._id === action.payload._id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
        state.message = "Project marked as completed successfully"
      })
  },
})

export const { clearError, clearMessage } = projectSlice.actions
export default projectSlice.reducer
