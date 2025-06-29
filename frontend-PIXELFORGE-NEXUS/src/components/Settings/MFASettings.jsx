"use client"

import { useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { setupMFA, enableMFA, disableMFA, clearError, clearMessage } from "../../store/slices/authSlice"

const MFASettings = () => {
  const [verificationCode, setVerificationCode] = useState("")
  const [showSetup, setShowSetup] = useState(false)

  const dispatch = useDispatch()
  const { user, loading, error, message, mfaSetup } = useSelector((state) => state.auth)

  const mfaEnabled = user?.mfaEnabled || false

  const handleSetupMFA = async () => {
    dispatch(clearError())
    dispatch(clearMessage())

    const result = await dispatch(setupMFA())

    if (setupMFA.fulfilled.match(result)) {
      setShowSetup(true)
    }
  }

  const handleEnableMFA = async (e) => {
    e.preventDefault()

    dispatch(clearError())
    dispatch(clearMessage())

    const result = await dispatch(enableMFA({ token: verificationCode, secret: mfaSetup.secret }))

    if (enableMFA.fulfilled.match(result)) {
      setShowSetup(false)
      setVerificationCode("")
    }
  }

  const handleDisableMFA = async () => {
    if (!window.confirm("Are you sure you want to disable MFA? This will reduce your account security.")) {
      return
    }

    const code = prompt("Please enter your current MFA code to disable:")
    if (!code) return

    dispatch(clearError())
    dispatch(clearMessage())

    await dispatch(disableMFA({ token: code }))
  }

  return (
    <div className="mfa-settings">
      <h3>Multi-Factor Authentication</h3>

      <div className="mfa-status">
        <p>
          <strong>Status:</strong>
          <span className={`status ${mfaEnabled ? "enabled" : "disabled"}`}>{mfaEnabled ? "Enabled" : "Disabled"}</span>
        </p>

        {mfaEnabled ? (
          <p>Your account is protected with multi-factor authentication.</p>
        ) : (
          <p>Enable MFA to add an extra layer of security to your account.</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}

      {!mfaEnabled && !showSetup && (
        <button onClick={handleSetupMFA} className="setup-btn" disabled={loading}>
          {loading ? "Setting up..." : "Setup MFA"}
        </button>
      )}

      {showSetup && mfaSetup && (
        <div className="mfa-setup">
          <h4>Setup Multi-Factor Authentication</h4>

          <div className="setup-steps">
            <div className="step">
              <h5>Step 1: Install an Authenticator App</h5>
              <p>
                Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your mobile
                device.
              </p>
            </div>

            <div className="step">
              <h5>Step 2: Scan QR Code</h5>
              {mfaSetup.qrCode && (
                <div className="qr-code">
                  <img src={mfaSetup.qrCode || "/placeholder.svg"} alt="MFA QR Code" />
                </div>
              )}
              <p>
                Or manually enter this secret: <code>{mfaSetup.secret}</code>
              </p>
            </div>

            <div className="step">
              <h5>Step 3: Verify Setup</h5>
              <form onSubmit={handleEnableMFA} className="verification-form">
                <div className="form-group">
                  <label htmlFor="verificationCode">Enter 6-digit code from your app:</label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength="6"
                    placeholder="123456"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-actions">
                  <button type="button" onClick={() => setShowSetup(false)} className="cancel-btn" disabled={loading}>
                    Cancel
                  </button>
                  <button type="submit" className="verify-btn" disabled={loading || verificationCode.length !== 6}>
                    {loading ? "Verifying..." : "Enable MFA"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mfaEnabled && (
        <button onClick={handleDisableMFA} className="disable-btn" disabled={loading}>
          {loading ? "Disabling..." : "Disable MFA"}
        </button>
      )}
    </div>
  )
}

export default MFASettings
