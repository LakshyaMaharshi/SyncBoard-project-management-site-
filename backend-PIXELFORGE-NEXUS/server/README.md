# PixelForge Nexus Backend

Secure project management system backend built with Express.js, MongoDB, and comprehensive security features.

## Features

### 🔐 Security Features
- **JWT Authentication** with secure token management
- **Multi-Factor Authentication (MFA)** using TOTP
- **Password Hashing** with bcrypt (12 rounds)
- **Rate Limiting** to prevent abuse
- **Account Locking** after failed login attempts
- **Role-based Access Control (RBAC)**
- **Input Validation** and sanitization
- **File Upload Security** with type and size validation

### 📊 Core Functionality
- **User Management** with role-based permissions
- **Project Management** with full CRUD operations
- **Document Management** with secure file uploads
- **Team Assignment** and project collaboration
- **Email Notifications** for important events

### 🛡️ Security Middleware
- Helmet for security headers
- CORS configuration
- Request rate limiting
- File upload validation
- Error handling without information leakage

## Installation

1. **Clone and navigate to backend directory:**
   \`\`\`bash
   cd server
   \`\`\`

2. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables:**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   Edit `.env` with your configuration values.

4. **Start MongoDB:**
   \`\`\`bash
   # Using MongoDB locally
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   \`\`\`

5. **Seed the database (optional):**
   \`\`\`bash
   npm run seed
   \`\`\`

6. **Start the server:**
   \`\`\`bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   \`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login with optional MFA
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/verify` - Verify JWT token
- `PUT /api/auth/password` - Update password
- `POST /api/auth/mfa/setup` - Setup MFA
- `POST /api/auth/mfa/enable` - Enable MFA
- `POST /api/auth/mfa/disable` - Disable MFA

### Projects
- `GET /api/projects` - Get projects (filtered by role)
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project (admin only)
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (admin only)
- `POST /api/projects/:id/assign` - Assign developer
- `POST /api/projects/:id/remove` - Remove developer
- `POST /api/projects/:id/documents` - Upload document
- `GET /api/projects/:id/documents` - Get project documents
- `GET /api/projects/:id/documents/:docId/download` - Download document
- `DELETE /api/projects/:id/documents/:docId` - Delete document

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `GET /api/users/stats/overview` - User statistics (admin only)

## Database Models

### User Model
\`\`\`javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: ['admin', 'project_lead', 'developer'],
  mfaEnabled: Boolean,
  mfaSecret: String,
  isActive: Boolean,
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date
}
\`\`\`

### Project Model
\`\`\`javascript
{
  name: String,
  description: String,
  deadline: Date,
  status: ['active', 'completed', 'on_hold', 'cancelled'],
  priority: ['low', 'medium', 'high', 'critical'],
  projectLead: ObjectId (User),
  assignedDevelopers: [ObjectId (User)],
  createdBy: ObjectId (User),
  documents: [ObjectId (Document)],
  estimatedHours: Number,
  actualHours: Number
}
\`\`\`

### Document Model
\`\`\`javascript
{
  filename: String,
  originalName: String,
  mimetype: String,
  size: Number,
  path: String,
  project: ObjectId (Project),
  uploadedBy: ObjectId (User),
  description: String,
  downloadCount: Number
}
\`\`\`

## Security Configuration

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (12 rounds)
- Password change tracking

### Account Security
- Maximum 5 failed login attempts
- 2-hour account lock after failed attempts
- JWT token expiration (7 days default)

### File Upload Security
- Maximum file size: 10MB
- Allowed file types: PDF, DOC, DOCX, TXT, XLS, XLSX, Images
- File type validation
- Secure file storage

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 requests per 15 minutes

## Environment Variables

\`\`\`env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/pixelforge-nexus
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
EMAIL_USERNAME=your-email-username
EMAIL_PASSWORD=your-email-password
\`\`\`

## Default Users (After Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@pixelforge.com | Admin123!@# |
| Project Lead | john.smith@pixelforge.com | Lead123!@# |
| Developer | alice.johnson@pixelforge.com | Dev123!@# |
| Developer | bob.wilson@pixelforge.com | Dev123!@# |
| Developer | carol.davis@pixelforge.com | Dev123!@# |

## Testing

\`\`\`bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
\`\`\`

## Production Deployment

1. **Set environment to production:**
   \`\`\`env
   NODE_ENV=production
   \`\`\`

2. **Configure production database:**
   \`\`\`env
   MONGODB_URI=mongodb://your-production-db
   \`\`\`

3. **Set strong JWT secret:**
   \`\`\`env
   JWT_SECRET=your-very-strong-production-secret
   \`\`\`

4. **Configure email service:**
   \`\`\`env
   SENDGRID_USERNAME=your-sendgrid-username
   SENDGRID_PASSWORD=your-sendgrid-password
   \`\`\`

5. **Start with PM2 (recommended):**
   \`\`\`bash
   npm install -g pm2
   pm2 start server.js --name pixelforge-nexus
   \`\`\`

## Security Best Practices Implemented

- ✅ Input validation and sanitization
- ✅ SQL injection prevention (NoSQL injection)
- ✅ XSS protection with Helmet
- ✅ CSRF protection considerations
- ✅ Rate limiting and DDoS protection
- ✅ Secure file uploads
- ✅ Password hashing and salting
- ✅ JWT token security
- ✅ Role-based access control
- ✅ Account lockout mechanisms
- ✅ Secure error handling
- ✅ HTTPS enforcement (production)
- ✅ Environment variable security

## License

This project is developed for Coventry University coursework and should not be distributed without permission.
