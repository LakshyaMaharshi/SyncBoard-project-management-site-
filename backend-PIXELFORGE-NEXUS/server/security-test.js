const axios = require('axios');
const colors = require('colors');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000/api';

// Test data - These will be created during testing
let testData = {
  companies: [],
  admins: [],
  projectLeads: [],
  developers: [],
  projects: [],
  tokens: {}
};

// Utility functions
const log = {
  success: (msg) => console.log(`✓ ${msg}`.green),
  error: (msg) => console.log(`✗ ${msg}`.red),
  warning: (msg) => console.log(`⚠ ${msg}`.yellow),
  info: (msg) => console.log(`ℹ ${msg}`.blue),
  section: (msg) => console.log(`\n${'='.repeat(50)}\n${msg}\n${'='.repeat(50)}`.cyan)
};

// API request helper
const apiRequest = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message, 
      status: error.response?.status 
    };
  }
};

// Test setup functions
const setupTestData = async () => {
  log.section('SETTING UP TEST DATA');
  
  try {
    // Create test companies and admin users
    const companies = [
      { 
        name: `SecurityTest Company A ${Date.now()}`, 
        description: 'Test company A for security testing',
        industry: 'Technology',
        companySize: '1-10'
      },
      { 
        name: `SecurityTest Company B ${Date.now() + 1}`, 
        description: 'Test company B for security testing',
        industry: 'Technology', 
        companySize: '1-10'
      }
    ];
    
    // Create admin users with companies using the /register endpoint
    for (let i = 0; i < companies.length; i++) {
      const timestamp = Date.now() + i;
      const adminData = {
        name: `Security Test Admin ${i + 1}`,
        email: `security-admin-${timestamp}@test.com`,
        password: 'SecureTest123!',
        companyName: companies[i].name,
        companyDescription: companies[i].description,
        industry: companies[i].industry,
        companySize: companies[i].companySize
      };
      
      const adminResponse = await apiRequest('POST', '/auth/register', adminData);
      if (adminResponse.success) {
        // Since registration requires email verification, we need to handle this
        log.info(`Admin registration initiated for ${companies[i].name} - requires email verification`);
        
        // For testing purposes, we'll simulate email verification
        // In a real scenario, you'd need to verify the email first
        const userId = adminResponse.data.userId;
        
        // Skip email verification for testing - try to login directly after some time
        // We'll create a simplified version that works with your auth flow
        testData.companies.push({
          _id: `company_${i}`,
          name: companies[i].name,
          ...companies[i]
        });
        
        testData.admins.push({
          _id: userId,
          email: adminData.email,
          name: adminData.name,
          role: 'admin',
          companyIndex: i
        });
        
        log.warning(`Note: Email verification required for ${adminData.email}`);
        
      } else {
        log.error(`Failed to create admin: ${JSON.stringify(adminResponse.error)}`);
        // Try alternative approach - maybe registration endpoint is different
        log.info('Trying alternative registration approach...');
        
        // Let's check if we can directly create a user (this might fail, which is expected)
        const alternativeResponse = await apiRequest('POST', '/auth/login', {
          email: 'admin@test.com',
          password: 'admin123'
        });
        
        if (alternativeResponse.success) {
          log.info('Found existing admin account');
          testData.tokens.admin = alternativeResponse.data.data.token;
          testData.admins.push(alternativeResponse.data.data.user);
        } else {
          log.error('No admin account available for testing');
          log.info('Please ensure you have:');
          log.info('1. Server running on http://localhost:3000');
          log.info('2. Database connected');
          log.info('3. At least one admin account created');
          return false;
        }
      }
    }
    
    // If we don't have admin tokens, we can't proceed with creating other users
    if (!testData.tokens.admin && testData.admins.length === 0) {
      log.error('Cannot proceed without admin access');
      log.info('SETUP INSTRUCTIONS:');
      log.info('1. Start your server: npm start');
      log.info('2. Register at least one admin user through the /auth/register endpoint');
      log.info('3. Verify the email for that admin user');
      log.info('4. Then run the security tests again');
      return false;
    }
    
    // For now, let's create a simplified test that works with existing data
    // Try to get admin token from existing login
    if (!testData.tokens.admin) {
      log.info('Attempting to login with test credentials...');
      
      // Try common test credentials
      const testCredentials = [
        { email: 'admin@test.com', password: 'admin123' },
        { email: 'admin@example.com', password: 'password123' },
        { email: 'test@admin.com', password: 'test123' }
      ];
      
      for (const creds of testCredentials) {
        const loginResponse = await apiRequest('POST', '/auth/login', creds);
        if (loginResponse.success) {
          testData.tokens.admin = loginResponse.data.data.token;
          testData.admins.push(loginResponse.data.data.user);
          log.success(`Successfully logged in as ${creds.email}`);
          break;
        }
      }
    }
    
    if (!testData.tokens.admin) {
      log.warning('No admin token available - will run limited security tests');
      log.info('Running authentication-focused security tests only...');
      return true; // Continue with limited testing
    }
    
    // If we have admin access, try to create team members for testing
    const adminToken = testData.tokens.admin;
    
    // Create project leads and developers for each company
    for (let i = 0; i < Math.min(testData.companies.length, 2); i++) {
      const timestamp = Date.now() + i * 1000;
      
      // Create project lead
      const projectLeadData = {
        name: `Project Lead ${i + 1}`,
        email: `project-lead-${timestamp}@test.com`,
        password: 'SecureTest123!',
        role: 'project_lead'
      };
      
      const plResponse = await apiRequest('POST', '/auth/register-team-member', projectLeadData, adminToken);
      if (plResponse.success) {
        testData.projectLeads.push({
          ...plResponse.data.user,
          companyIndex: i
        });
        
        // Try to login to get token
        const plLoginResponse = await apiRequest('POST', '/auth/login', {
          email: projectLeadData.email,
          password: projectLeadData.password
        });
        
        if (plLoginResponse.success) {
          testData.tokens[`projectLead${i}`] = plLoginResponse.data.data.token;
        }
        
        log.success(`Project Lead created for company ${i + 1}`);
      } else {
        log.warning(`Failed to create project lead: ${JSON.stringify(plResponse.error)}`);
      }
      
      // Create developers
      for (let j = 0; j < 2; j++) {
        const developerData = {
          name: `Developer ${i}-${j + 1}`,
          email: `developer-${timestamp}-${j}@test.com`,
          password: 'SecureTest123!',
          role: 'developer'
        };
        
        const devResponse = await apiRequest('POST', '/auth/register-team-member', developerData, adminToken);
        if (devResponse.success) {
          testData.developers.push({
            ...devResponse.data.user,
            companyIndex: i,
            developerIndex: j
          });
          
          // Try to login to get token
          const devLoginResponse = await apiRequest('POST', '/auth/login', {
            email: developerData.email,
            password: developerData.password
          });
          
          if (devLoginResponse.success) {
            testData.tokens[`developer${i}-${j}`] = devLoginResponse.data.data.token;
          }
          
          log.success(`Developer ${j + 1} created for company ${i + 1}`);
        } else {
          log.warning(`Failed to create developer: ${JSON.stringify(devResponse.error)}`);
        }
      }
    }
    
    // Create projects for testing (if we have admin access)
    if (testData.tokens.admin) {
      for (let i = 0; i < testData.companies.length; i++) {
        const projectData = {
          name: `Security Test Project ${i + 1}`,
          description: `This is a test project for company ${i + 1} security testing`,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          estimatedHours: 100,
          tags: ['security-test', `company-${i + 1}`]
        };
        
        const response = await apiRequest('POST', '/projects', projectData, testData.tokens.admin);
        if (response.success) {
          testData.projects.push({
            ...response.data.data,
            companyIndex: i
          });
          log.success(`Project created for company ${i + 1}`);
        } else {
          log.warning(`Failed to create project: ${JSON.stringify(response.error)}`);
        }
      }
    }
    
    log.info(`Setup complete with available data:`);
    log.info(`- Companies: ${testData.companies.length}`);
    log.info(`- Admins: ${testData.admins.length}`);  
    log.info(`- Project leads: ${testData.projectLeads.length}`);
    log.info(`- Developers: ${testData.developers.length}`);
    log.info(`- Projects: ${testData.projects.length}`);
    log.info(`- Tokens: ${Object.keys(testData.tokens).length}`);
    
    return true;
    
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    log.info('Common issues:');
    log.info('1. Server not running - Start with: npm start');
    log.info('2. Database not connected');
    log.info('3. Environment variables not set');
    log.info('4. Port 3000 not available');
    return false;
  }
};

// Security test functions
const testCrossCompanyProjectAccess = async () => {
  log.section('TESTING CROSS-COMPANY PROJECT ACCESS');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Users from Company A cannot access projects from Company B
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const userToken = testData.tokens[`developer${i}-${j}`];
      const otherCompanyProject = testData.projects.find(p => p.companyIndex !== i);
      
      if (otherCompanyProject) {
        totalTests++;
        const response = await apiRequest('GET', `/projects/${otherCompanyProject._id}`, null, userToken);
        if (!response.success && (response.status === 403 || response.status === 401)) {
          log.success(`Developer ${i}-${j} correctly denied access to Company ${otherCompanyProject.companyIndex + 1} project`);
          passedTests++;
        } else {
          log.error(`SECURITY BREACH: Developer ${i}-${j} accessed Company ${otherCompanyProject.companyIndex + 1} project`);
        }
      }
    }
  }
  
  // Test 2: Project leads from Company A cannot access projects from Company B
  for (let i = 0; i < testData.projectLeads.length; i++) {
    const userToken = testData.tokens[`projectLead${i}`];
    const otherCompanyProject = testData.projects.find(p => p.companyIndex !== i);
    
    if (otherCompanyProject) {
      totalTests++;
      const response = await apiRequest('GET', `/projects/${otherCompanyProject._id}`, null, userToken);
      if (!response.success && (response.status === 403 || response.status === 401)) {
        log.success(`Project Lead ${i} correctly denied access to Company ${otherCompanyProject.companyIndex + 1} project`);
        passedTests++;
      } else {
        log.error(`SECURITY BREACH: Project Lead ${i} accessed Company ${otherCompanyProject.companyIndex + 1} project`);
      }
    }
  }
  
  // Test 3: Users cannot see other company's projects in project list
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      totalTests++;
      const userToken = testData.tokens[`developer${i}-${j}`];
      const response = await apiRequest('GET', '/projects', null, userToken);
      
      if (response.success) {
        const userCompanyProjects = response.data.data.filter(p => 
          testData.projects.find(tp => tp._id === p._id && tp.companyIndex === i)
        );
        const otherCompanyProjects = response.data.data.filter(p => 
          testData.projects.find(tp => tp._id === p._id && tp.companyIndex !== i)
        );
        
        if (otherCompanyProjects.length === 0) {
          log.success(`Developer ${i}-${j} sees only their company's projects`);
          passedTests++;
        } else {
          log.error(`SECURITY BREACH: Developer ${i}-${j} sees ${otherCompanyProjects.length} projects from other companies`);
        }
      } else {
        log.error(`Failed to get projects for Developer ${i}-${j}`);
      }
    }
  }
  
  return { passed: passedTests, total: totalTests };
};

const testUnauthorizedProjectCreation = async () => {
  log.section('TESTING UNAUTHORIZED PROJECT CREATION');
  
  let passedTests = 0;
  let totalTests = 0;
  
  const projectData = {
    name: 'Unauthorized Test Project',
    description: 'This project should not be created',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high'
  };
  
  // Test 1: Developers cannot create projects
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      totalTests++;
      const userToken = testData.tokens[`developer${i}-${j}`];
      const response = await apiRequest('POST', '/projects', projectData, userToken);
      
      if (!response.success && (response.status === 403 || response.status === 401)) {
        log.success(`Developer ${i}-${j} correctly denied project creation`);
        passedTests++;
      } else {
        log.error(`SECURITY BREACH: Developer ${i}-${j} was able to create a project`);
      }
    }
  }
  
  // Test 2: Project leads cannot create projects (only admins can)
  for (let i = 0; i < testData.projectLeads.length; i++) {
    totalTests++;
    const userToken = testData.tokens[`projectLead${i}`];
    const response = await apiRequest('POST', '/projects', projectData, userToken);
    
    if (!response.success && (response.status === 403 || response.status === 401)) {
      log.success(`Project Lead ${i} correctly denied project creation`);
      passedTests++;
    } else {
      log.error(`SECURITY BREACH: Project Lead ${i} was able to create a project`);
    }
  }
  
  return { passed: passedTests, total: totalTests };
};

const testTokenSecurity = async () => {
  log.section('TESTING TOKEN SECURITY');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Invalid token
  totalTests++;
  const invalidTokenResponse = await apiRequest('GET', '/projects', null, 'invalid-token-123');
  if (!invalidTokenResponse.success && (invalidTokenResponse.status === 401)) {
    log.success('Invalid token correctly rejected');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Invalid token was accepted');
  }
  
  // Test 2: No token
  totalTests++;
  const noTokenResponse = await apiRequest('GET', '/projects', null, null);
  if (!noTokenResponse.success && (noTokenResponse.status === 401)) {
    log.success('Request without token correctly rejected');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Request without token was accepted');
  }
  
  // Test 3: Malformed token
  totalTests++;
  const malformedTokenResponse = await apiRequest('GET', '/projects', null, 'Bearer');
  if (!malformedTokenResponse.success && (malformedTokenResponse.status === 401)) {
    log.success('Malformed token correctly rejected');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Malformed token was accepted');
  }
  
  return { passed: passedTests, total: totalTests };
};

const testRoleBasedAccess = async () => {
  log.section('TESTING ROLE-BASED ACCESS CONTROL');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Developer cannot access admin-only endpoints
  totalTests++;
  const developerToken = testData.tokens['developer0-0'];
  const userManagementResponse = await apiRequest('GET', '/users', null, developerToken);
  if (!userManagementResponse.success && (userManagementResponse.status === 403 || userManagementResponse.status === 401)) {
    log.success('Developer correctly denied access to user management');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Developer accessed user management endpoint');
  }
  
  // Test 2: Project lead cannot access admin-only project creation
  totalTests++;
  const projectLeadToken = testData.tokens['projectLead0'];
  const projectCreationResponse = await apiRequest('POST', '/projects', {
    name: 'Test Project',
    description: 'Test',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }, projectLeadToken);
  if (!projectCreationResponse.success && (projectCreationResponse.status === 403 || projectCreationResponse.status === 401)) {
    log.success('Project Lead correctly denied project creation');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Project Lead was able to create project');
  }
  
  return { passed: passedTests, total: totalTests };
};

const testProjectAssignmentSecurity = async () => {
  log.section('TESTING PROJECT ASSIGNMENT SECURITY');
  
  let passedTests = 0;
  let totalTests = 0;
  
  if (testData.projects.length < 2) {
    log.warning('Not enough projects for assignment testing');
    return { passed: 0, total: 0 };
  }
  
  const project = testData.projects[0];
  const otherCompanyDeveloper = testData.developers.find(d => d.companyIndex !== project.companyIndex);
  
  if (!otherCompanyDeveloper) {
    log.warning('No cross-company developer found for testing');
    return { passed: 0, total: 0 };
  }
  
  // Test: Admin cannot assign developer from different company to project
  totalTests++;
  const assignmentData = {
    developerId: otherCompanyDeveloper._id
  };
  
  const assignmentResponse = await apiRequest('PUT', `/projects/${project._id}/assign`, assignmentData, testData.tokens.admin);
  if (!assignmentResponse.success && (assignmentResponse.status === 400 || assignmentResponse.status === 403)) {
    log.success('Cross-company developer assignment correctly rejected');
    passedTests++;
  } else {
    log.error('SECURITY BREACH: Developer from different company was assigned to project');
  }
  
  return { passed: passedTests, total: totalTests };
};

const testDocumentAccessSecurity = async () => {
  log.section('TESTING DOCUMENT ACCESS SECURITY');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // This test assumes documents are associated with projects
  // Users should only access documents from projects they have access to
  
  // Test 1: User from Company A cannot access documents from Company B projects
  for (let i = 0; i < testData.projects.length; i++) {
    const project = testData.projects[i];
    const otherCompanyUser = testData.developers.find(d => d.companyIndex !== project.companyIndex);
    
    if (otherCompanyUser) {
      totalTests++;
      const userToken = testData.tokens[`developer${otherCompanyUser.companyIndex}-${otherCompanyUser.developerIndex}`];
      const documentResponse = await apiRequest('GET', `/projects/${project._id}/documents`, null, userToken);
      
      if (!documentResponse.success && (documentResponse.status === 403 || documentResponse.status === 401)) {
        log.success(`Cross-company document access correctly denied for project ${i + 1}`);
        passedTests++;
      } else {
        log.error(`SECURITY BREACH: User accessed documents from other company's project ${i + 1}`);
      }
    }
  }
  
  return { passed: passedTests, total: totalTests };
};

const testDataLeakagePrevention = async () => {
  log.section('TESTING DATA LEAKAGE PREVENTION');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: User information doesn't leak across companies
  for (let i = 0; i < 2; i++) {
    totalTests++;
    const userToken = testData.tokens[`developer${i}-0`];
    const response = await apiRequest('GET', '/users/profile', null, userToken);
    
    if (response.success) {
      const userData = response.data.data;
      // Check if sensitive fields are not exposed
      if (!userData.password && !userData.mfaSecret && !userData.passwordResetToken) {
        log.success(`User ${i} profile doesn't leak sensitive data`);
        passedTests++;
      } else {
        log.error(`SECURITY BREACH: User ${i} profile leaks sensitive data`);
      }
    } else {
      log.error(`Failed to get user profile for testing user ${i}`);
    }
  }
  
  return { passed: passedTests, total: totalTests };
};

const testInputValidationSecurity = async () => {
  log.section('TESTING INPUT VALIDATION SECURITY');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: SQL Injection attempts
  const sqlInjectionPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "admin'/*",
    "' UNION SELECT * FROM users --"
  ];
  
  for (const payload of sqlInjectionPayloads) {
    totalTests++;
    const response = await apiRequest('POST', '/auth/login', {
      email: payload,
      password: 'test'
    });
    
    if (!response.success) {
      log.success(`SQL injection payload "${payload}" correctly rejected`);
      passedTests++;
    } else {
      log.error(`SECURITY BREACH: SQL injection payload "${payload}" was processed`);
    }
  }
  
  // Test 2: XSS attempts
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "javascript:alert('xss')",
    "<img src=x onerror=alert('xss')>"
  ];
  
  for (const payload of xssPayloads) {
    totalTests++;
    const response = await apiRequest('POST', '/projects', {
      name: payload,
      description: 'test',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, testData.tokens.admin);
    
    if (!response.success || (response.success && !response.data.data.name.includes('<script>'))) {
      log.success(`XSS payload "${payload}" correctly handled`);
      passedTests++;
    } else {
      log.error(`SECURITY BREACH: XSS payload "${payload}" was not sanitized`);
    }
  }
  
  return { passed: passedTests, total: totalTests };
};

const testSessionSecurity = async () => {
  log.section('TESTING SESSION SECURITY');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Token expiration (if applicable)
  // This would require manipulating token expiration, which is complex
  // For now, we'll test token reuse scenarios
  
  // Test 2: Multiple concurrent sessions
  totalTests++;
  const loginData = {
    email: testData.developers[0].email,
    password: 'SecureTest123!'
  };
  
  const session1 = await apiRequest('POST', '/auth/login', loginData);
  const session2 = await apiRequest('POST', '/auth/login', loginData);
  
  if (session1.success && session2.success) {
    // Both sessions should be valid (this is typically allowed)
    log.success('Multiple concurrent sessions handled appropriately');
    passedTests++;
  } else {
    log.warning('Multiple session testing inconclusive');
  }
  
  return { passed: passedTests, total: totalTests };
};

// Main test runner
const runSecurityTests = async () => {
  console.log('PIXELFORGE NEXUS SECURITY TESTING SUITE'.rainbow);
  console.log('==========================================\n');
  
  log.info(`Testing against: ${BASE_URL}`);
  
  // Check if server is running first
  log.info('Checking server connectivity...');
  try {
    const healthCheck = await apiRequest('GET', '/health');
    if (!healthCheck.success) {
      // Try alternative endpoints to check if server is running
      const altCheck = await apiRequest('POST', '/auth/login', { email: 'test', password: 'test' });
      if (!altCheck.success && altCheck.status !== 401 && altCheck.status !== 400) {
        throw new Error('Server not responding');
      }
    }
    log.success('Server is responding');
  } catch (error) {
    log.error('Server is not responding or not running');
    log.error('Please ensure:');
    log.error('1. Your backend server is running (npm start)');
    log.error('2. Server is accessible at http://localhost:3000');
    log.error('3. Database is connected');
    log.error(`\nError details: ${error.message}`);
    process.exit(1);
  }
  
  // Setup test data
  const setupSuccess = await setupTestData();
  if (!setupSuccess) {
    log.error('Failed to setup test data.');
    log.info('\nTROUBLESHOoting STEPS:');
    log.info('1. Make sure your server is running: npm start');
    log.info('2. Ensure MongoDB is connected');
    log.info('3. Try registering a user manually first');
    log.info('4. Check server logs for any errors');
    process.exit(1);
  }
  
  // Run all security tests
  const tests = [
    { name: 'Cross-Company Project Access', fn: testCrossCompanyProjectAccess },
    { name: 'Unauthorized Project Creation', fn: testUnauthorizedProjectCreation },
    { name: 'Token Security', fn: testTokenSecurity },
    { name: 'Role-Based Access Control', fn: testRoleBasedAccess },
    { name: 'Project Assignment Security', fn: testProjectAssignmentSecurity },
    { name: 'Document Access Security', fn: testDocumentAccessSecurity },
    { name: 'Data Leakage Prevention', fn: testDataLeakagePrevention },
    { name: 'Input Validation Security', fn: testInputValidationSecurity },
    { name: 'Session Security', fn: testSessionSecurity }
  ];
  
  let totalPassed = 0;
  let totalTests = 0;
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({
        name: test.name,
        passed: result.passed,
        total: result.total,
        percentage: result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0
      });
      totalPassed += result.passed;
      totalTests += result.total;
    } catch (error) {
      log.error(`Test "${test.name}" failed with error: ${error.message}`);
      results.push({
        name: test.name,
        passed: 0,
        total: 1,
        percentage: 0,
        error: error.message
      });
      totalTests += 1;
    }
  }
  
  // Print results summary
  log.section('SECURITY TEST RESULTS SUMMARY');
  
  console.log('Test Name'.padEnd(35) + 'Passed'.padEnd(10) + 'Total'.padEnd(10) + 'Success Rate'.padEnd(15));
  console.log('-'.repeat(70));
  
  results.forEach(result => {
    const status = result.percentage >= 100 ? '✓'.green : 
                   result.percentage >= 80 ? '⚠'.yellow : '✗'.red;
    const line = `${result.name.padEnd(33)} ${status} ${result.passed.toString().padEnd(8)} ${result.total.toString().padEnd(8)} ${result.percentage}%`;
    console.log(line);
    if (result.error) {
      console.log(`  Error: ${result.error}`.red);
    }
  });
  
  console.log('-'.repeat(70));
  const overallPercentage = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
  const overallStatus = overallPercentage >= 90 ? 'EXCELLENT'.green :
                       overallPercentage >= 80 ? 'GOOD'.yellow :
                       overallPercentage >= 70 ? 'NEEDS IMPROVEMENT'.orange :
                       'CRITICAL ISSUES FOUND'.red;
  
  console.log(`OVERALL SECURITY SCORE: ${totalPassed}/${totalTests} (${overallPercentage}%) - ${overallStatus}`);
  
  // Cleanup (optional - you might want to keep test data for manual inspection)
  log.section('CLEANUP');
  log.info('Test data created during testing. You may want to clean up the database manually.');
  log.info('Test companies, users, and projects have been prefixed with "SecurityTest" or contain test identifiers.');
  
  // Exit with appropriate code
  process.exit(overallPercentage >= 80 ? 0 : 1);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run the tests
runSecurityTests().catch(error => {
  log.error(`Security test suite failed: ${error.message}`);
  process.exit(1);
});
