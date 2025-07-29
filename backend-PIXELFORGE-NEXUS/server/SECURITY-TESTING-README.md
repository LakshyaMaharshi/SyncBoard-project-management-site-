# PixelForge Nexus Security Testing Suite

## Overview

This comprehensive security testing script validates all critical security aspects of the PixelForge Nexus backend system. It ensures proper authorization, access control, and data isolation between companies and users.

## Security Areas Tested

### 1. Cross-Company Data Isolation
- **Projects**: Users from Company A cannot access projects from Company B
- **User Lists**: Project lists are properly filtered by company
- **Data Leakage**: Sensitive user information is not exposed across companies

### 2. Role-Based Access Control (RBAC)
- **Admin Only**: Only admins can create projects and access user management
- **Project Lead**: Can only access assigned projects
- **Developer**: Can only access projects they are assigned to
- **Unauthorized Actions**: Lower privilege users cannot perform higher privilege actions

### 3. Authentication & Authorization
- **Token Validation**: Invalid, malformed, and missing tokens are rejected
- **Session Security**: Token reuse and concurrent sessions are handled appropriately
- **Password Security**: Proper password hashing and validation

### 4. Project Access Control
- **Project Visibility**: Users can only see projects within their company
- **Project Assignment**: Cannot assign users from different companies to projects
- **Document Access**: Document access is restricted to authorized project members

### 5. Input Validation & Security
- **SQL Injection**: Protection against SQL injection attempts
- **XSS Prevention**: Cross-site scripting payloads are sanitized
- **Data Validation**: Proper input validation on all endpoints

### 6. Multi-Factor Authentication (MFA)
- **MFA Enforcement**: When enabled, MFA is properly enforced
- **OTP Security**: One-time passwords are validated correctly
- **Account Lockout**: Failed authentication attempts trigger account lockout

## Prerequisites

1. **Running Server**: The backend server must be running
2. **Database Access**: MongoDB connection should be available
3. **Environment**: Ensure all environment variables are properly set
4. **Dependencies**: Install required npm packages

## Installation

1. Navigate to the server directory:
```bash
cd backend-PIXELFORGE-NEXUS/server
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Install the colors package for better output formatting:
```bash
npm install colors
```

## Usage

### Basic Usage

Run the security test suite with default settings:

```bash
npm run security-test
```

### Advanced Usage

You can customize the test by setting environment variables:

```bash
# Test against a different server
TEST_BASE_URL=http://localhost:3001/api npm run security-test

# Test against production (be careful!)
TEST_BASE_URL=https://your-production-api.com/api npm run security-test
```

## Test Process

The script follows this process:

1. **Setup Phase**:
   - Creates 2 test companies
   - Creates admin, project leads, and developers for each company
   - Creates test projects for each company
   - Generates authentication tokens

2. **Testing Phase**:
   - Runs 9 different security test categories
   - Each test validates specific security requirements
   - Records pass/fail results for each test

3. **Cleanup Information**:
   - Provides information about test data created
   - Test data is prefixed with "SecurityTest" for easy identification

## Understanding Results

### Output Format

```
✓ Passed test (green)
✗ Failed test (red)  
⚠ Warning or partial failure (yellow)
ℹ Information (blue)
```

### Result Summary

The script provides a detailed summary showing:
- Individual test results
- Pass/fail counts
- Success percentage
- Overall security score

### Security Score Interpretation

- **90-100%**: Excellent security posture
- **80-89%**: Good security with minor issues
- **70-79%**: Needs improvement
- **Below 70%**: Critical security issues found

## Test Categories Explained

### 1. Cross-Company Project Access
Tests that users cannot access projects from other companies through direct API calls or project listings.

### 2. Unauthorized Project Creation
Validates that only admins can create projects, preventing privilege escalation.

### 3. Token Security
Ensures proper JWT token validation and rejection of invalid tokens.

### 4. Role-Based Access Control
Verifies that users can only perform actions appropriate to their role.

### 5. Project Assignment Security
Tests that users cannot be assigned to projects outside their company.

### 6. Document Access Security
Validates that document access is properly restricted to project members.

### 7. Data Leakage Prevention
Ensures sensitive information (passwords, tokens, etc.) is not exposed in API responses.

### 8. Input Validation Security
Tests protection against common attack vectors like SQL injection and XSS.

### 9. Session Security
Validates proper session management and token handling.

## Common Issues and Solutions

### Test Setup Failures

If the setup phase fails:
1. Ensure the server is running
2. Check database connectivity
3. Verify API endpoints are accessible
4. Check for existing test data conflicts

### Authentication Errors

If authentication tests fail:
1. Verify JWT_SECRET is properly set
2. Check token expiration settings
3. Ensure user registration is working

### Database Issues

If database-related tests fail:
1. Check MongoDB connection
2. Verify database permissions
3. Clear any conflicting test data

## Best Practices

1. **Run Regularly**: Include security testing in your CI/CD pipeline
2. **Clean Database**: Use a separate test database or clean up test data regularly
3. **Monitor Results**: Track security test results over time
4. **Update Tests**: Keep security tests updated with new features
5. **Fix Issues**: Address any failed security tests immediately

## Customization

You can extend the security tests by:

1. **Adding New Test Categories**: Create new test functions following the existing pattern
2. **Custom Payloads**: Add specific attack vectors relevant to your use case
3. **Environment-Specific Tests**: Add tests for specific deployment configurations
4. **Performance Testing**: Add tests for rate limiting and DoS protection

## Security Test Data

The script creates the following test data:
- 2 Companies: "SecurityTest Company A" and "SecurityTest Company B"
- Admin users, project leads, and developers for each company
- Test projects for each company
- All test data is prefixed for easy identification

**Important**: Clean up test data from production databases after testing.

## Troubleshooting

### Common Error Messages

1. **"Failed to setup test data"**: Check server connectivity and database access
2. **"Authentication failed"**: Verify JWT configuration and user creation
3. **"SECURITY BREACH"**: Critical security issue found - investigate immediately

### Debug Mode

For detailed debugging, you can modify the script to add more logging or run individual test functions.

## Contributing

When adding new security tests:

1. Follow the existing function pattern
2. Include proper error handling
3. Add descriptive logging
4. Update this documentation
5. Test your additions thoroughly

## Warning

⚠️ **Important Security Notice**: This script creates test data in your database. Always run against a test environment first, and clean up test data from production systems.

## License

This security testing suite is part of the PixelForge Nexus project and follows the same MIT License.
