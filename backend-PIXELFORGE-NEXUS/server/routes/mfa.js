const { sendMfaOtpEmail } = require("../utils/email");
const crypto = require("crypto");

// POST /api/auth/mfa/setup
router.post("/mfa/setup", authenticate, catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  if (!user) return next(new AppError("User not found", 404));

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.mfaOtp = crypto.createHash("sha256").update(otp).digest("hex");
  user.mfaOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  await user.save({ validateBeforeSave: false });
  await sendMfaOtpEmail(user.email, user.name, otp);

  res.json({ success: true, message: "OTP sent to your email." });
}));

// POST /api/auth/mfa/enable
router.post("/mfa/enable", authenticate, catchAsync(async (req, res, next) => {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select("+mfaOtp +mfaOtpExpires");
    if (!user) return next(new AppError("User not found", 404));
    if (!user.mfaOtp || !user.mfaOtpExpires) return next(new AppError("No OTP setup in progress", 400));
    if (user.mfaOtpExpires < Date.now()) return next(new AppError("OTP expired", 400));
  
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== user.mfaOtp) return next(new AppError("Invalid OTP", 400));
  
    user.mfaEnabled = true;
    user.mfaOtp = undefined;
    user.mfaOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
  
    res.json({ success: true, message: "MFA enabled successfully." });
  }));

  // POST /api/auth/mfa/disable
router.post("/mfa/disable", authenticate, catchAsync(async (req, res, next) => {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select("+mfaOtp +mfaOtpExpires");
    if (!user) return next(new AppError("User not found", 404));
    if (!user.mfaOtp || !user.mfaOtpExpires) return next(new AppError("No OTP setup in progress", 400));
    if (user.mfaOtpExpires < Date.now()) return next(new AppError("OTP expired", 400));
  
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    if (hashedOtp !== user.mfaOtp) return next(new AppError("Invalid OTP", 400));
  
    user.mfaEnabled = false;
    user.mfaOtp = undefined;
    user.mfaOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });
  
    res.json({ success: true, message: "MFA disabled successfully." });
  }));