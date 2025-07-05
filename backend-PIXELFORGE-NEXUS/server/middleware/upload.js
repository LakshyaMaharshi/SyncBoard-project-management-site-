const multer = require("multer")
const path = require("path")
const fs = require("fs")
const { AppError } = require("./errorHandler")

const uploadDir = path.join(__dirname, "../uploads")
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const projectId = req.params.id || req.params.projectId
    const projectDir = path.join(uploadDir, projectId)

    if (!fs.existsSync(projectDir)) {
      fs.mkdirSync(projectDir, { recursive: true })
    }

    cb(null, projectDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    const filename = `${file.fieldname}-${uniqueSuffix}${extension}`
    cb(null, filename)
  },
})

const fileFilter = (req, file, cb) => {
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

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new AppError("File type not supported. Please upload PDF, DOC, DOCX, TXT, XLS, XLSX, or image files.", 400),
      false,
    )
  }
}
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, 
    files: 5, 
  },
})


const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new AppError("File size too large. Maximum size is 10MB.", 400))
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new AppError("Too many files. Maximum 5 files allowed.", 400))
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return next(new AppError("Unexpected field name for file upload.", 400))
    }
  }

  if (err) {
    return next(err)
  }

  next()
}

const uploadSingle = (fieldName = "document") => {
  return [upload.single(fieldName), handleUploadErrors]
}

const uploadMultiple = (fieldName = "documents", maxCount = 5) => {
  return [upload.array(fieldName, maxCount), handleUploadErrors]
}

const validateUploadedFile = (req, res, next) => {
  if (!req.file) {
    return next(new AppError("No file uploaded", 400))
  }
  const file = req.file

  if (file.size > 10 * 1024 * 1024) {
    return next(new AppError("File size exceeds 10MB limit", 400))
  }
  const extension = path.extname(file.originalname).toLowerCase()
  const mimetypeExtensions = {
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "text/plain": [".txt"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/gif": [".gif"],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  }

  const allowedExtensions = mimetypeExtensions[file.mimetype] || []
  if (!allowedExtensions.includes(extension)) {
    return next(new AppError("File extension does not match file type", 400))
  }

  next()
}

const cleanupUploadedFiles = (req, res, next) => {
  const originalSend = res.send

  res.send = function (data) {

    if (res.statusCode >= 400) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Error cleaning up file:", err)
        })
      }

      if (req.files && Array.isArray(req.files)) {
        req.files.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) console.error("Error cleaning up file:", err)
          })
        })
      }
    }

    originalSend.call(this, data)
  }

  next()
}

module.exports = {
  uploadSingle,
  uploadMultiple,
  validateUploadedFile,
  cleanupUploadedFiles,
  handleUploadErrors,
}
