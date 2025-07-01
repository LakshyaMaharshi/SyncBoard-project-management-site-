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
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Multi-Factor Authentication</h3>

      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          <strong className="font-medium text-gray-700">Status:</strong>{" "}
          <span
            className={`inline-block px-2 py-1 text-xs font-medium text-white rounded-full ${
              mfaEnabled ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {mfaEnabled ? "Enabled" : "Disabled"}
          </span>
        </p>
        <p className="text-sm text-gray-600">
          {mfaEnabled
            ? "Your account is protected with multi-factor authentication."
            : "Enable MFA to add an extra layer of security to your account."}
        </p>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}
      {message && <div className="text-green-600 text-sm">{message}</div>}

      {!mfaEnabled && !showSetup && (
        <button
          onClick={handleSetupMFA}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Setting up..." : "Setup MFA"}
        </button>
      )}

      {showSetup && mfaSetup && (
        <div className="space-y-6">
          <h4 className="text-md font-semibold text-gray-800">Setup Multi-Factor Authentication</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700">Step 1: Install an Authenticator App</h5>
              <p className="text-sm text-gray-600">
                Install an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your mobile
                device.
              </p>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700">Step 2: Scan QR Code</h5>
              {mfaSetup.qrCode && (
                <div className="my-4">
                  <img
                    src={mfaSetup.qrCode || "/placeholder.svg"}
                    alt="MFA QR Code"
                    className="w-32 h-32 mx-auto border border-gray-300 rounded-md"
                  />
                </div>
              )}
              <p className="text-sm text-gray-600">
                Or manually enter this secret: <code className="bg-gray-100 px-1 py-0.5 rounded">{mfaSetup.secret}</code>
              </p>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700">Step 3: Verify Setup</h5>
              <form onSubmit={handleEnableMFA} className="space-y-4 mt-2">
                <div>
                  <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
                    Enter 6-digit code from your app:
                  </label>
                  <input
                    type="text"
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength="6"
                    placeholder="123456"
                    required
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowSetup(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={loading || verificationCode.length !== 6}
                  >
                    {loading ? "Verifying..." : "Enable MFA"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mfaEnabled && (
        <button
          onClick={handleDisableMFA}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Disabling..." : "Disable MFA"}
        </button>
      )}
    </div>
  )
}

export default MFASettings