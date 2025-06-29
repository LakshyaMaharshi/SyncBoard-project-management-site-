const speakeasy = require("speakeasy")
const QRCode = require("qrcode")

// Generate MFA secret for user
const generateMFASecret = (userEmail, serviceName = "PixelForge Nexus") => {
  const secret = speakeasy.generateSecret({
    name: userEmail,
    issuer: serviceName,
    length: 32,
  })

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
  }
}

// Generate QR code for MFA setup
const generateQRCode = async (otpauthUrl) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl)
    return qrCodeDataURL
  } catch (error) {
    throw new Error("Failed to generate QR code")
  }
}

// Verify MFA token
const verifyMFAToken = (token, secret) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: "base32",
    token: token,
    window: 2, // Allow 2 time steps (60 seconds) of tolerance
  })
}

// Generate backup codes for MFA
const generateBackupCodes = (count = 8) => {
  const codes = []
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase()
    codes.push(code)
  }
  return codes
}

// Validate MFA token format
const validateMFATokenFormat = (token) => {
  // MFA tokens should be 6 digits
  const tokenRegex = /^\d{6}$/
  return tokenRegex.test(token)
}

module.exports = {
  generateMFASecret,
  generateQRCode,
  verifyMFAToken,
  generateBackupCodes,
  validateMFATokenFormat,
}
