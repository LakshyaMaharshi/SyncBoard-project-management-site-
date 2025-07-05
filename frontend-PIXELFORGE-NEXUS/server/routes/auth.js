
if (user.mfaEnabled) {
  console.log('LOGIN DEBUG:', { email, mfaCode, mfaOtp: user.mfaOtp, mfaOtpExpires: user.mfaOtpExpires, now: Date.now() });
  if (!mfaCode || mfaCode === "") {
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex")
    
    user.mfaOtp = hashedOtp
    user.mfaOtpExpires = Date.now() + 10 * 60 * 1000
    await user.save({ validateBeforeSave: false })
    
    await sendMfaOtpEmail(user.email, user.name, otp)
    
    return res.status(200).json({
      success: false,
      requiresMFA: true,
      message: "MFA code sent to your email",
    })
  }
} 