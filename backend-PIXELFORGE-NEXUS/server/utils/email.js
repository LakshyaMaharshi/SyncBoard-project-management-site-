const nodemailer = require("nodemailer")

// Create email transporter
const createTransporter = () => {
  if (process.env.NODE_ENV === "production") {
    // Production email configuration (e.g., SendGrid, AWS SES)
    return nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.SENDGRID_USERNAME,
        pass: process.env.SENDGRID_PASSWORD,
      },
    })
  } else {
    // Development email configuration (Ethereal Email for testing)
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
}

// Send welcome email to new user
const sendWelcomeEmail = async (userEmail, userName, temporaryPassword) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@pixelforge.com",
    to: userEmail,
    subject: "Welcome to PixelForge Nexus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Welcome to PixelForge Nexus!</h2>
        <p>Hello ${userName},</p>
        <p>Your account has been created successfully. Here are your login credentials:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
        </div>
        <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after your first login for security reasons.</p>
        <p>You can access the system at: <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}">${process.env.FRONTEND_URL || "http://localhost:3000"}</a></p>
        <p>If you have any questions, please contact your system administrator.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Welcome email sent to ${userEmail}`)
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw new Error("Failed to send welcome email")
  }
}

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  const transporter = createTransporter()
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@pixelforge.com",
    to: userEmail,
    subject: "Password Reset Request - PixelForge Nexus",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Password Reset Request</h2>
        <p>Hello ${userName},</p>
        <p>You have requested to reset your password for your PixelForge Nexus account.</p>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p style="color: #e74c3c;"><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
        <p>If you didn't request this password reset, please ignore this email and your password will remain unchanged.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Password reset email sent to ${userEmail}`)
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw new Error("Failed to send password reset email")
  }
}

// Send project assignment notification
const sendProjectAssignmentEmail = async (userEmail, userName, projectName, projectDescription) => {
  const transporter = createTransporter()

  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@pixelforge.com",
    to: userEmail,
    subject: `New Project Assignment - ${projectName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">New Project Assignment</h2>
        <p>Hello ${userName},</p>
        <p>You have been assigned to a new project:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #2c3e50; margin-top: 0;">${projectName}</h3>
          <p>${projectDescription}</p>
        </div>
        <p>You can view the project details and access related documents by logging into the PixelForge Nexus system.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard" style="background-color: #27ae60; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a>
        </div>
        <p>If you have any questions about this project, please contact your project lead or system administrator.</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Project assignment email sent to ${userEmail}`)
  } catch (error) {
    console.error("Error sending project assignment email:", error)
    // Don't throw error for notification emails
  }
}

// Send MFA OTP email
const sendMfaOtpEmail = async (userEmail, userName, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.FROM_EMAIL || "noreply@pixelforge.com",
    to: userEmail,
    subject: "Your PixelForge Nexus MFA OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db;">Multi-Factor Authentication (MFA) OTP</h2>
        <p>Hello ${userName},</p>
        <p>Your OTP for enabling MFA is:</p>
        <div style="font-size: 2em; font-weight: bold; margin: 20px 0;">${otp}</div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendProjectAssignmentEmail,
  sendMfaOtpEmail,
}
