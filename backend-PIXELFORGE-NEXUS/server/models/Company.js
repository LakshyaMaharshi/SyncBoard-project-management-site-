const mongoose = require("mongoose")

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Company name is required"],
      unique: true,
      trim: true,
      minlength: [2, "Company name must be at least 2 characters long"],
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Company description cannot exceed 500 characters"],
    },
    website: {
      type: String,
      trim: true,
      validate: {
        validator: (v) => {
          if (!v) return true // Optional field
          return /^https?:\/\/.+/.test(v)
        },
        message: "Please provide a valid website URL",
      },
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [50, "Industry cannot exceed 50 characters"],
    },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+"],
      default: "1-10",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

// Indexes for performance
companySchema.index({ name: 1 })
companySchema.index({ isActive: 1 })
companySchema.index({ createdBy: 1 })

// Virtual for employee count
companySchema.virtual("employeeCount", {
  ref: "User",
  localField: "_id",
  foreignField: "company",
  count: true,
})

// Virtual for project count
companySchema.virtual("projectCount", {
  ref: "Project",
  localField: "_id",
  foreignField: "company",
  count: true,
})

module.exports = mongoose.model("Company", companySchema)
