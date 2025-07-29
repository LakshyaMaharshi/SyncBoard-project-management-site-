# PixelForge Nexus Security Testing Suite

## Quick Start

1. **Navigate to server directory:**
   ```bash
   cd backend-PIXELFORGE-NEXUS/server
   ```

2. **Run the complete security test setup:**
   ```bash
   npm run security-setup
   ```

   This will automatically:
   - Install required dependencies
   - Check if your server is running
   - Run the complete security test suite

3. **Or run tests manually:**
   ```bash
   npm run security-test
   ```

## What Gets Tested

### 🏢 Company Isolation Security
- ✅ Projects from Company A are invisible to Company B users
- ✅ User lists are properly filtered by company
- ✅ Cross-company data access is blocked

### 👥 Role-Based Access Control
- ✅ Only admins can create projects
- ✅ Project leads can only access their assigned projects
- ✅ Developers can only access projects they're assigned to
- ✅ Unauthorized role elevation is prevented

### 🔐 Authentication & Authorization
- ✅ Invalid tokens are rejected
- ✅ Missing tokens are handled properly
- ✅ Malformed tokens are blocked
- ✅ Session security is maintained

### 📁 Project Access Control
- ✅ Project visibility respects company boundaries
- ✅ Cross-company project assignment is blocked
- ✅ Document access is restricted to project members

### 🛡️ Input Validation & Security
- ✅ SQL injection attempts are blocked
- ✅ XSS payloads are sanitized
- ✅ Malformed data is rejected

### 🔒 Data Protection
- ✅ Sensitive data (passwords, tokens) is not exposed
- ✅ User information doesn't leak across companies
- ✅ API responses are properly sanitized

## Security Test Results

The script will show you results like this:

```
=====================================
SECURITY TEST RESULTS SUMMARY
=====================================

Test Name                          Passed    Total     Success Rate
----------------------------------------------------------------------
Cross-Company Project Access    ✓    12        12        100.0%
Unauthorized Project Creation    ✓     4         4        100.0%
Token Security                   ✓     3         3        100.0%
Role-Based Access Control        ✓     2         2        100.0%
Project Assignment Security      ✓     1         1        100.0%
Document Access Security         ✓     2         2        100.0%
Data Leakage Prevention         ✓     2         2        100.0%
Input Validation Security        ✓     7         7        100.0%
Session Security                 ✓     1         1        100.0%
----------------------------------------------------------------------
OVERALL SECURITY SCORE: 34/34 (100.0%) - EXCELLENT
```

## Critical Security Issues Tested

### 🚨 Most Important Tests

1. **Company Data Isolation**: Ensures Company A cannot see Company B's projects
2. **User Role Enforcement**: Prevents privilege escalation attacks
3. **Token Security**: Blocks unauthorized API access
4. **Input Validation**: Prevents injection attacks

### 🔍 What to Look For

- **Red ✗ marks**: Critical security vulnerabilities
- **Yellow ⚠ marks**: Potential security concerns
- **Green ✓ marks**: Security measures working correctly

## Test Data Created

The security tests create temporary data:
- 2 test companies ("SecurityTest Company A" and "SecurityTest Company B")
- Admin users, project leads, and developers
- Test projects for each company
- Authentication tokens for testing

**Note**: All test data is clearly marked and can be safely removed after testing.

## Common Security Issues This Script Will Catch

1. **Cross-Company Data Breach**: User from Company A accessing Company B's projects
2. **Role Privilege Escalation**: Developer performing admin actions
3. **Authentication Bypass**: Accessing API without valid tokens
4. **Injection Attacks**: SQL injection or XSS vulnerabilities
5. **Data Leakage**: Sensitive information exposed in API responses

## Running in Different Environments

### Development Environment
```bash
npm run security-setup
```

### Custom Server URL
```bash
TEST_BASE_URL=http://localhost:3001/api npm run security-test
```

### Production Testing (Be Careful!)
```bash
TEST_BASE_URL=https://your-api.com/api npm run security-test
```

## Files Created

1. **`security-test.js`** - Main security testing script
2. **`setup-security-test.js`** - Automated setup and dependency installer
3. **`SECURITY-TESTING-README.md`** - Detailed documentation
4. **`.env.security-test`** - Configuration options
5. **`SECURITY-QUICK-START.md`** - This quick start guide

## Troubleshooting

### "Server is not responding"
- Make sure your backend server is running: `npm start`
- Check if MongoDB is running
- Verify the TEST_BASE_URL is correct

### "Failed to setup test data"
- Check database connectivity
- Ensure proper environment variables are set
- Clear any conflicting test data

### "Authentication failed"
- Verify JWT_SECRET is properly configured
- Check user registration endpoints are working

## Security Best Practices

1. **Run Regularly**: Include in your CI/CD pipeline
2. **Monitor Results**: Track security scores over time
3. **Fix Immediately**: Address any failed security tests right away
4. **Update Tests**: Keep security tests current with new features
5. **Document Issues**: Log and track security improvements

## Next Steps

After running the security tests:

1. **Review Results**: Check for any failed tests
2. **Fix Issues**: Address any security vulnerabilities found
3. **Regular Testing**: Set up automated security testing
4. **Monitor**: Keep track of your security score over time

## Support

If you encounter issues:
1. Check the detailed `SECURITY-TESTING-README.md`
2. Review the test output for specific error messages
3. Ensure all prerequisites are met
4. Verify your server configuration

---

**⚠️ Important**: Always run security tests in a test environment first. This script creates test data that should be cleaned up from production databases.
