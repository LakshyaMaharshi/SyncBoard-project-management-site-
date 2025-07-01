import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authAPI } from "../../services/api"

// Async thunks
export const loginUser = createAsyncThunk("auth/login", async ({ email, password, mfaCode }, { rejectWithValue }) => {
  try {
    const response = await authAPI.login({ email, password, mfaCode })
    const { token, user } = response.data.data

    localStorage.setItem("token", token)
    return { token, user }
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.message || "Login failed",
      requiresMFA: error.response?.data?.requiresMFA || false,
    })
  }
})

export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData)

    // Handle auto-login after registration
    if (response.data.data && response.data.data.token) {
      const { token, user } = response.data.data
      localStorage.setItem("token", token)
      return { token, user, autoLogin: true }
    }

    return { message: "User registered successfully" }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Registration failed")
  }
})

export const verifyToken = createAsyncThunk("auth/verify", async (token, { rejectWithValue }) => {
  try {
    const response = await authAPI.verifyToken(token)
    return response.data.user
  } catch (error) {
    localStorage.removeItem("token")
    return rejectWithValue("Token verification failed")
  }
})

export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      await authAPI.updatePassword({ currentPassword, newPassword })
      return "Password updated successfully"
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Password update failed")
    }
  },
)

export const setupMFA = createAsyncThunk("auth/setupMFA", async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.setupMFA()
    return { message: response.data.message }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "MFA setup failed")
  }
})

export const enableMFA = createAsyncThunk("auth/enableMFA", async ({ otp }, { rejectWithValue }) => {
  try {
    await authAPI.enableMFA({ otp })
    return "MFA enabled successfully"
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "MFA enable failed")
  }
})

export const disableMFA = createAsyncThunk("auth/disableMFA", async ({ otp }, { rejectWithValue }) => {
  try {
    await authAPI.disableMFA({ otp })
    return "MFA disabled successfully"
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "MFA disable failed")
  }
})

const initialState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
  requiresMFA: false,
  mfaSetup: null,
  message: null,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem("token")
      state.user = null
      state.token = null
      state.error = null
      state.requiresMFA = false
      state.mfaSetup = null
      state.message = null
    },
    clearError: (state) => {
      state.error = null
    },
    clearMessage: (state) => {
      state.message = null
    },
    setLoading: (state, action) => {
      state.loading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true
        state.error = null
        state.requiresMFA = false
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.error = null
        state.requiresMFA = false
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload.message
        state.requiresMFA = action.payload.requiresMFA
      })

      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload.autoLogin) {
          state.user = action.payload.user
          state.token = action.payload.token
        }
        state.message = action.payload.message || "Registration successful! Welcome to PixelForge Nexus."
        state.error = null
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Verify Token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.error = null
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
      })

      // Update Password
      .addCase(updatePassword.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updatePassword.fulfilled, (state, action) => {
        state.loading = false
        state.message = action.payload
        state.error = null
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Setup MFA
      .addCase(setupMFA.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(setupMFA.fulfilled, (state, action) => {
        state.loading = false
        state.mfaSetup = true // Show OTP input
        state.message = action.payload.message
        state.error = null
      })
      .addCase(setupMFA.rejected, (state, action) => {
        state.loading = false
        state.mfaSetup = null
        state.error = action.payload
      })

      // Enable MFA
      .addCase(enableMFA.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(enableMFA.fulfilled, (state, action) => {
        state.loading = false
        state.user = { ...state.user, mfaEnabled: true }
        state.mfaSetup = null
        state.message = action.payload
        state.error = null
      })
      .addCase(enableMFA.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Disable MFA
      .addCase(disableMFA.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(disableMFA.fulfilled, (state, action) => {
        state.loading = false
        state.user = { ...state.user, mfaEnabled: false }
        state.message = action.payload
        state.error = null
      })
      .addCase(disableMFA.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { logout, clearError, clearMessage, setLoading } = authSlice.actions
export default authSlice.reducer
