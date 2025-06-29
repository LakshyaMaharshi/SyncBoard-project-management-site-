"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import PasswordUpdate from "./PasswordUpdate"
import MFASettings from "./MFASettings"
import "./AccountSettings.css"

const AccountSettings = () => {
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("password")

  return (
    <div className="account-settings">
      <div className="settings-header">
        <h1>Account Settings</h1>
        <p>Manage your account security and preferences</p>
      </div>

      <div className="settings-tabs">
        <button className={`tab ${activeTab === "password" ? "active" : ""}`} onClick={() => setActiveTab("password")}>
          Password
        </button>
        <button className={`tab ${activeTab === "mfa" ? "active" : ""}`} onClick={() => setActiveTab("mfa")}>
          Multi-Factor Authentication
        </button>
      </div>

      <div className="settings-content">
        <div className="user-info">
          <h3>User Information</h3>
          <p>
            <strong>Name:</strong> {user?.name}
          </p>
          <p>
            <strong>Email:</strong> {user?.email}
          </p>
          <p>
            <strong>Role:</strong> {user?.role?.replace("_", " ")}
          </p>
        </div>

        {activeTab === "password" && <PasswordUpdate />}
        {activeTab === "mfa" && <MFASettings />}
      </div>
    </div>
  )
}

export default AccountSettings
