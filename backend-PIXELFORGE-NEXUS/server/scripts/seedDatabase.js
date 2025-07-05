const mongoose = require("mongoose")
const User = require("../models/User")
const Project = require("../models/Project")
require("dotenv").config()

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/pixelforge-nexus")
    console.log("Connected to MongoDB")

    await User.deleteMany({})
    await Project.deleteMany({})
    console.log("Cleared existing data")

    const admin = new User({
      name: "System Administrator",
      email: "admin@pixelforge.com",
      password: "Admin123!@#",
      role: "admin",
    })
    await admin.save()
    console.log("Created admin user")

    const projectLead = new User({
      name: "John Smith",
      email: "john.smith@pixelforge.com",
      password: "Lead123!@#",
      role: "project_lead",
    })
    await projectLead.save()
    console.log("Created project lead user")

    const developer1 = new User({
      name: "Alice Johnson",
      email: "alice.johnson@pixelforge.com",
      password: "Dev123!@#",
      role: "developer",
    })
    await developer1.save()

    const developer2 = new User({
      name: "Bob Wilson",
      email: "bob.wilson@pixelforge.com",
      password: "Dev123!@#",
      role: "developer",
    })
    await developer2.save()

    const developer3 = new User({
      name: "Carol Davis",
      email: "carol.davis@pixelforge.com",
      password: "Dev123!@#",
      role: "developer",
    })
    await developer3.save()
    console.log("Created developer users")

    const project1 = new Project({
      name: "Mobile Game Development",
      description: "Develop a new mobile puzzle game with engaging graphics and challenging levels.",
      deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), 
      projectLead: projectLead._id,
      assignedDevelopers: [developer1._id, developer2._id],
      createdBy: admin._id,
      priority: "high",
      estimatedHours: 500,
      tags: ["mobile", "game", "puzzle"],
    })
    await project1.save()

    const project2 = new Project({
      name: "Web Platform Redesign",
      description: "Complete redesign of the company website with modern UI/UX and improved performance.",
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 
      projectLead: projectLead._id,
      assignedDevelopers: [developer2._id, developer3._id],
      createdBy: admin._id,
      priority: "medium",
      estimatedHours: 300,
      tags: ["web", "design", "frontend"],
    })
    await project2.save()

    const project3 = new Project({
      name: "API Integration System",
      description: "Build a robust API integration system for third-party services.",
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), 
      projectLead: projectLead._id,
      assignedDevelopers: [developer1._id],
      createdBy: admin._id,
      priority: "critical",
      estimatedHours: 200,
      tags: ["api", "backend", "integration"],
    })
    await project3.save()

    console.log("Created sample projects")

    console.log("\n=== SEED DATA CREATED SUCCESSFULLY ===")
    console.log("\nDefault Users Created:")
    console.log("Admin: admin@pixelforge.com / Admin123!@#")
    console.log("Project Lead: john.smith@pixelforge.com / Lead123!@#")
    console.log("Developer 1: alice.johnson@pixelforge.com / Dev123!@#")
    console.log("Developer 2: bob.wilson@pixelforge.com / Dev123!@#")
    console.log("Developer 3: carol.davis@pixelforge.com / Dev123!@#")
    console.log("\nSample Projects Created:")
    console.log("- Mobile Game Development")
    console.log("- Web Platform Redesign")
    console.log("- API Integration System")
    console.log("\n=== READY TO USE ===")
  } catch (error) {
    console.error("Error seeding database:", error)
  } finally {
    await mongoose.disconnect()
    console.log("Disconnected from MongoDB")
    process.exit(0)
  }
}

seedDatabase()
