# Quick Security Testing Guide

## 🚀 Quick Start (Server Not Running Yet)

If your server isn't running yet, start here:

### 1. Start Your Server First
```bash
# In the server directory
npm start
```

### 2. Run Basic Security Tests (No Setup Required)
```bash
npm run security-test-basic
```
This will test basic security features without requiring user accounts or complex setup.

---

## 🔧 Full Security Testing (Requires Running Server)

For comprehensive security testing that covers company isolation and role-based access:

### Option 1: Automated Setup (Recommended)
```bash
npm run security-setup
```
This will:
- Install dependencies
- Check server connectivity  
- Run comprehensive security tests

### Option 2: Manual Testing
```bash
npm run security-test
```

---

## 🆘 Troubleshooting

### "Server not responding" Error

**Problem**: The security test can't connect to your server.

**Solutions**:
1. **Start your server**:
   ```bash
   npm start
   ```

2. **Check if server is running**:
   - Open http://localhost:3000 in your browser
   - You should see your API response or website

3. **Check the port**:
   - Make sure your server is running on port 3000
   - If using a different port, set the environment variable:
     ```bash
     TEST_BASE_URL=http://localhost:YOUR_PORT/api npm run security-test-basic
     ```

### "Failed to create admin" Error

**Problem**: The comprehensive test can't create admin users for testing.

**Solutions**:

1. **Use Basic Security Test First**:
   ```bash
   npm run security-test-basic
   ```
   This tests fundamental security without requiring user creation.

2. **Create Admin User Manually**:
   - Register a user through your app's registration process
   - Verify the email if required
   - Then run the full security test

3. **Check Registration Endpoint**:
   - Make sure `/auth/register` endpoint is working
   - Verify email verification is not blocking the process

### Database Connection Issues

**Problem**: Can't connect to MongoDB.

**Solutions**:
1. **Start MongoDB**:
   ```bash
   # If using local MongoDB
   mongod
   
   # If using MongoDB service
   net start MongoDB
   ```

2. **Check Environment Variables**:
   - Ensure `MONGODB_URI` or `DATABASE_URL` is set correctly
   - Verify database credentials

---

## 📊 Understanding Test Results

### Basic Security Test Results
```
✓ Server Connectivity             ✓    1        1        100.0%
✓ Basic Authentication Security   ✓    4        4        100.0%
✓ Input Validation               ✓    8        8        100.0%
⚠ Rate Limiting                  ⚠    0        1        0.0%
✓ Password Policy                ✓    5        5        100.0%
✓ Security Headers               ✓    5        5        100.0%
```

### What Each Test Means:

- **✓ Green**: Security measure is working correctly
- **⚠ Yellow**: Security measure needs attention  
- **✗ Red**: Critical security vulnerability found

### Score Interpretation:
- **90-100%**: Excellent security
- **80-89%**: Good security, minor improvements needed
- **70-79%**: Needs improvement
- **Below 70%**: Critical security issues

---

## 🔒 Key Security Areas Tested

### Basic Tests (No Setup Required):
1. **Server Connectivity** - Is your server responding?
2. **Authentication Security** - Are invalid tokens rejected?
3. **Input Validation** - Protection against injection attacks
4. **Rate Limiting** - Protection against abuse
5. **Password Policy** - Are weak passwords rejected?
6. **Security Headers** - HTTP security headers present?

### Comprehensive Tests (Requires Setup):
1. **Company Data Isolation** - Company A can't see Company B's data
2. **Role-Based Access** - Users can only perform authorized actions
3. **Project Access Control** - Proper project visibility controls
4. **Document Security** - Document access restrictions
5. **Cross-Company Prevention** - No unauthorized cross-company access

---

## 🎯 Which Test Should You Run?

### Run Basic Tests If:
- ✅ Your server is running
- ✅ You want quick security validation
- ✅ You don't have admin accounts set up yet
- ✅ You're debugging server issues

### Run Comprehensive Tests If:
- ✅ Basic tests are passing
- ✅ You have admin accounts available
- ✅ You want full security validation
- ✅ You're preparing for production

---

## 📝 Next Steps After Testing

### If Tests Pass:
1. ✅ Great! Your security measures are working
2. 🔄 Set up automated security testing in CI/CD
3. 📅 Schedule regular security test runs
4. 📊 Monitor security scores over time

### If Tests Fail:
1. 🔍 Review the specific failed tests
2. 🛠️ Fix the identified security issues
3. 🧪 Re-run tests to verify fixes
4. 📚 Check documentation for security best practices

---

## 🚨 Critical Security Issues to Fix Immediately

If you see these in your test results:

- **❌ Invalid tokens accepted** - Fix JWT validation
- **❌ Cross-company data access** - Fix authorization logic  
- **❌ SQL injection vulnerabilities** - Add input sanitization
- **❌ No rate limiting** - Implement rate limiting
- **❌ Weak passwords accepted** - Strengthen password policies

---

## 📞 Support

If you're still having issues:

1. **Check Server Logs**: Look for error messages in your server console
2. **Verify Environment**: Ensure all environment variables are set
3. **Test Manually**: Try making API requests manually with tools like Postman
4. **Check Documentation**: Review the detailed `SECURITY-TESTING-README.md`

## 🔄 Regular Testing

**Recommendation**: Run security tests regularly:

```bash
# Add to your development workflow
npm run security-test-basic

# Add to your deployment pipeline  
npm run security-test
```

This ensures your security measures remain effective as your application evolves.
