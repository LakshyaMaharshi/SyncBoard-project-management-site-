const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")
const morgan = require("morgan")
const path = require("path")
require("dotenv").config()

// Import routes
const authRoutes = require("./routes/auth")
const mfaRoutes = require("./routes/mfa")
const projectRoutes = require("./routes/projects")
const userRoutes = require("./routes/users")
const downloadDocs = require('./routes/docsDownload');

// Import middleware
const { errorHandler } = require("./middleware/errorHandler")

const app = express()

// Security middleware
app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
})
app.use("/api/", limiter)

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
})
app.use("/api/auth/login", authLimiter)

// Body parsing middleware
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

// Logging middleware
app.use(morgan("combined"))

// Static files for uploaded documents
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Database connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pixelforge-nexus", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB")
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

// Add graceful shutdown handling
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully")
  await mongoose.connection.close()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully")
  await mongoose.connection.close()
  process.exit(0)
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/auth", mfaRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/users", userRoutes)
app.use(downloadDocs);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Handle 404 routes
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`)
})

module.exports = app
