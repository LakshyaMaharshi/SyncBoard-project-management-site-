"use client"

import { useState } from "react"
import "./DocumentUpload.css"

const DocumentUpload = ({ onUpload, onCancel }) => {
  const [file, setFile] = useState(null)
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(selectedFile.type)) {
      alert("File type not supported. Please upload PDF, Word, Excel, Text, or Image files.")
      return
    }

    // Validate file size (10MB limit)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size cannot exceed 10MB")
      return
    }

    setFile(selectedFile)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file to upload")
      return
    }

    setUploading(true)
    try {
      const result = await onUpload(file, description)
      if (result.success) {
        setFile(null)
        setDescription("")
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="document-upload">
      <div className="upload-container">
        <div
          className={`file-drop-zone ${dragActive ? "active" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="file-selected">
              <div className="file-info">
                <h4>{file.name}</h4>
                <p>Size: {formatFileSize(file.size)}</p>
                <p>Type: {file.type}</p>
              </div>
              <button onClick={() => setFile(null)} className="remove-file-btn">
                Remove
              </button>
            </div>
          ) : (
            <div className="drop-zone-content">
              <p>Drag and drop a file here, or click to select</p>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                className="file-input"
              />
            </div>
          )}
        </div>

        <div className="upload-form">
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter a description for this document..."
              rows={3}
              maxLength={500}
            />
            <small>{description.length}/500 characters</small>
          </div>

          <div className="upload-actions">
            <button onClick={onCancel} className="cancel-btn" disabled={uploading}>
              Cancel
            </button>
            <button onClick={handleUpload} className="upload-btn" disabled={!file || uploading}>
              {uploading ? "Uploading..." : "Upload Document"}
            </button>
          </div>
        </div>
      </div>

      <div className="upload-info">
        <h4>Supported File Types:</h4>
        <ul>
          <li>Documents: PDF, Word (.doc, .docx), Text (.txt)</li>
          <li>Images: JPEG, PNG, GIF</li>
          <li>Spreadsheets: Excel (.xls, .xlsx)</li>
        </ul>
        <p>Maximum file size: 10MB</p>
      </div>
    </div>
  )
}

export default DocumentUpload
