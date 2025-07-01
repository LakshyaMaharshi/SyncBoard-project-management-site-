"use client"

import { useState } from "react"
import { useSelector } from "react-redux"
import PasswordUpdate from "./PasswordUpdate"
import MFASettings from "./MFASettings"

const AccountSettings = () => {
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("password")

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Account Settings</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your account security and preferences</p>
        </div>

        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "password"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onClick={() => setActiveTab("password")}
          >
            Password
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "mfa"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            onClick={() => setActiveTab("mfa")}
          >
            Multi-Factor Authentication
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">User Information</h3>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                <strong className="font-medium text-gray-700">Name:</strong> {user?.name || "Not available"}
              </p>
              <p className="text-sm text-gray-600">
                <strong className="font-medium text-gray-700">Email:</strong> {user?.email || "Not available"}
              </p>
              <p className="text-sm text-gray-600">
                <strong className="font-medium text-gray-700">Role:</strong>{" "}
                {user?.role?.replace("_", " ") || "Not available"}
              </p>
            </div>
          </div>

          {activeTab === "password" && <PasswordUpdate />}
          {activeTab === "mfa" && <MFASettings />}
        </div>
      </div>
    </div>
  )
}

export default AccountSettings