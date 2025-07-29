import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { authAPI } from "../../services/api"

export const loginUser = createAsyncThunk("auth/login", async ({ email, password, mfaCode }, { rejectWithValue }) => {
  try {
    const response = await authAPI.login({ email, password, mfaCode });
    if (response.data.requiresMFA) {
      return rejectWithValue({
        message: response.data.message,
        requiresMFA: true,
      });
    }
    const { token, user } = response.data.data;
    localStorage.setItem("token", token);
    return { token, user };
  } catch (error) {
    return rejectWithValue({
      message: error.response?.data?.message || "Login failed",
      requiresMFA: error.response?.data?.requiresMFA || false,
    });
  }
});

export const registerUser = createAsyncThunk("auth/register", async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData)

    if (response.data.requiresEmailVerification) {
      return { 
        message: response.data.message,
        requiresEmailVerification: true,
        userId: response.data.userId
      }
    }

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

export const verifyEmail = createAsyncThunk("auth/verifyEmail", async (verificationData, { rejectWithValue }) => {
  try {
    const response = await authAPI.verifyEmail(verificationData)
    const { token, user } = response.data.data

    localStorage.setItem("token", token)
    return { token, user, message: response.data.message }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Email verification failed")
  }
})

export const verifyToken = createAsyncThunk("auth/verify", async (token, { rejectWithValue }) => {
  try {
    const response = await authAPI.verifyToken(token)
    return response.data.user
  } catch {
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

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (email, { rejectWithValue }) => {
    try {
      const response = await authAPI.forgotPassword(email)
      return response.data.message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to send reset email")
    }
  }
)

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authAPI.resetPassword({ token, newPassword })
      return response.data.message
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Password reset failed")
    }
  }
)

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
        state.error = action.payload?.message || 'Login failed'
        state.requiresMFA = action.payload?.requiresMFA || false
      })

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

      .addCase(verifyEmail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.message = action.payload.message
        state.error = null
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

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

      .addCase(setupMFA.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(setupMFA.fulfilled, (state, action) => {
        state.loading = false
        state.mfaSetup = true 
        state.message = action.payload.message
        state.error = null
      })
      .addCase(setupMFA.rejected, (state, action) => {
        state.loading = false
        state.mfaSetup = null
        state.error = action.payload
      })

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

      .addCase(forgotPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.loading = false
        state.message = action.payload
        state.error = null
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.message = null
      })

      .addCase(resetPassword.pending, (state) => {
        state.loading = true
        state.error = null
        state.message = null
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.loading = false
        state.message = action.payload
        state.error = null
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.message = null
      })
  },
})

export const { logout, clearError, clearMessage, setLoading } = authSlice.actions
export default authSlice.reducer
