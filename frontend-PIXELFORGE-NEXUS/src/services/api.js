import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

// Auth API
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData), 
  verifyEmail: (verificationData) => api.post("/auth/verify-email", verificationData),
  registerTeamMember: (userData) => api.post("/auth/register-team-member", userData), 
  verifyToken: (token) =>
    api.get("/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
    }),
  updatePassword: (passwordData) => api.put("/auth/password", passwordData),
  setupMFA: () => api.post("/auth/mfa/setup"),
  enableMFA: (data) => api.post("/auth/mfa/enable", data),
  disableMFA: (data) => api.post("/auth/mfa/disable", data),
  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
  resetPassword: (resetData) => api.post("/auth/reset-password", resetData),
}

export const projectAPI = {
  getProjects: () => api.get("/projects"),
  getAllActiveProjects: () => api.get("/projects/active"),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (projectData) => api.post("/projects", projectData),
  updateProject: (id, updates) => api.put(`/projects/${id}`, updates),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  completeProject: (id) => api.patch(`/projects/${id}/complete`),
  assignDeveloper: (projectId, developerId) => api.post(`/projects/${projectId}/assign`, { developerId }),
  removeDeveloper: (projectId, developerId) => api.post(`/projects/${projectId}/remove`, { developerId }),
  uploadDocument: (projectId, formData) =>
    api.post(`/projects/${projectId}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getProjectDocuments: (projectId) => api.get(`/projects/${projectId}/documents`),
  deleteDocument: (projectId, documentId) => api.delete(`/projects/${projectId}/documents/${documentId}`),
  downloadDocument: (projectId, documentId) =>
    api.get(`/projects/${projectId}/documents/${documentId}/download`, {
      responseType: "blob",
    }),
}

export const userAPI = {
  getUsers: () => api.get("/users"),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, updates) => api.put(`/users/${id}`, updates),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getDevelopers: () => api.get("/users/developers"),
}

export default api
