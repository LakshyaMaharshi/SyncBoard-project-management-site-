import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { userAPI } from "../../services/api"

export const fetchUsers = createAsyncThunk("users/fetchUsers", async (_, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const role = state.auth?.user?.role;
    let response;
    if (role === "project_lead") {
      response = await userAPI.getDevelopers();
    } else {
      response = await userAPI.getUsers();
    }
    return response.data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to fetch users")
  }
})

export const updateUser = createAsyncThunk("users/updateUser", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const response = await userAPI.updateUser(id, updates)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to update user")
  }
})

export const deleteUser = createAsyncThunk("users/deleteUser", async (userId, { rejectWithValue }) => {
  try {
    await userAPI.deleteUser(userId)
    return userId
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to delete user")
  }
})

const initialState = {
  users: [],
  loading: false,
  error: null,
  message: null,
}

const userSlice = createSlice({
  name: "users",
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
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload
        state.error = null
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.users.findIndex((u) => u._id === action.payload._id)
        if (index !== -1) {
          state.users[index] = action.payload
        }
        state.message = "User updated successfully"
      })

      .addCase(deleteUser.fulfilled, (state, action) => {
        state.users = state.users.filter((u) => u._id !== action.payload)
        state.message = "User deleted successfully"
      })
  },
})

export const { clearError, clearMessage } = userSlice.actions
export default userSlice.reducer
