const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const validator = require("validator")

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
      select: false, // Don't include password in queries by default
    },
    role: {
      type: String,
      enum: ["admin", "project_lead", "developer"],
      default: "developer",
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      // Made optional for initial creation, but will be required after company is created
      required: function () {
        // Only require company if this is not the initial admin user creation
        return this.isNew && this.role !== "admin" ? true : false
      },
    },
    mfaEnabled: {
      type: Boolean,
      default: false,
    },
    mfaSecret: {
      type: String,
      select: false, // Don't include MFA secret in queries by default
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      default: Date.now,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.password
        delete ret.mfaSecret
        delete ret.__v
        return ret
      },
    },
  },
)

// Indexes for performance
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ company: 1 })

// Virtual for account lock status
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next()

  try {
    // Hash the password with cost of 12
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)

    // Update password changed timestamp
    this.passwordChangedAt = Date.now() - 1000 // Subtract 1 second to ensure JWT is created after password change

    next()
  } catch (error) {
    next(error)
  }
})

// Pre-save middleware to validate company requirement
userSchema.pre("save", function (next) {
  // If user has been saved before and doesn't have a company, require it
  if (!this.isNew && !this.company) {
    return next(new Error("Company is required for existing users"))
  }
  next()
})

// Instance method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    throw new Error("Password not available for comparison")
  }
  return await bcrypt.compare(candidatePassword, this.password)
}

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = Number.parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

// Instance method to handle failed login attempts
userSchema.methods.incLoginAttempts = function () {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    })
  }

  const updates = { $inc: { loginAttempts: 1 } }

  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 } // 2 hours
  }

  return this.updateOne(updates)
}

// Instance method to reset login attempts
userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
  })
}

// Static method to find user by email with password
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email, isActive: true }).select("+password +mfaSecret").populate("company")
}

module.exports = mongoose.model("User", userSchema)
