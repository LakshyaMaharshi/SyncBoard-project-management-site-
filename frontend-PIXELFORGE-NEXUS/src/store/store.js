import { configureStore } from "@reduxjs/toolkit"
import authSlice from "./slices/authSlice"
import projectSlice from "./slices/projectSlice"
import userSlice from "./slices/userSlice"

export const store = configureStore({
  reducer: {
    auth: authSlice,
    projects: projectSlice,
    users: userSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
})

export default store