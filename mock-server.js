import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5180', 'http://localhost:5188'],
  credentials: true
}));

app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `batch-photo-${uniqueSuffix}${fileExtension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Mock user data
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@boochbuddy.com',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockToken = 'mock-jwt-token-for-preview';

// Track current logged-in user
let currentLoggedInUser = null;

// In-memory user storage for mock server
let mockUsers = [
  {
    id: 1, username: 'admin', email: 'admin@boochbuddy.com', firstName: 'Admin', lastName: 'User',
    role: 'admin', is_active: true, email_verified: true, failed_login_attempts: 0, locked_until: null,
    department: 'Administration', phone: '+1-555-0001', timezone: 'America/New_York', language: 'en',
    two_factor_enabled: true, created_at: '2024-01-01T00:00:00Z', updated_at: new Date().toISOString(),
    last_login: new Date().toISOString(), password_changed_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2, username: 'jbcsmkt', email: 'jbcsmkt@boochbuddy.com', firstName: 'JB', lastName: 'Admin',
    role: 'admin', is_active: true, email_verified: true, failed_login_attempts: 0, locked_until: null,
    department: 'Administration', phone: '+1-555-0002', timezone: 'America/New_York', language: 'en',
    two_factor_enabled: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    last_login: new Date().toISOString(), password_changed_at: new Date().toISOString()
  }
];

// Initialize OpenAI client if API key is available
const openaiClient = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Booch Buddy Mock API is running',
    timestamp: new Date().toISOString()
  });
});

// Auth endpoints
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // Accept any username/password for preview
  if (username && password) {
    // Find user in mockUsers array or create if not exists
    let user = mockUsers.find(u => u.username === username);
    
    if (!user) {
      // If user doesn't exist and it's jbcsmkt or admin, use the existing one
      // Otherwise, don't create new users automatically
      if (username === 'jbcsmkt' || username === 'admin') {
        user = mockUsers.find(u => u.username === username);
      }
    }
    
    if (user) {
      // Update last login
      user.last_login = new Date().toISOString();
      
      // Track current logged-in user
      currentLoggedInUser = user;
      
      // Set secure httpOnly cookie to match our new authentication system
      res.cookie('auth_token', mockToken, {
        httpOnly: true,
        secure: false, // false for development
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Send only user data, no token in response body
      res.json({ user });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } else {
    res.status(400).json({ error: 'Username and password are required' });
  }
});

app.post('/api/auth/register', (req, res) => {
  // Set secure httpOnly cookie
  res.cookie('auth_token', mockToken, {
    httpOnly: true,
    secure: false, // false for development
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  res.status(201).json({ user: mockUser });
});

app.get('/api/auth/me', (req, res) => {
  // Return the current logged-in user or default to admin
  const user = currentLoggedInUser || mockUsers[0];
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  currentLoggedInUser = null;
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// User management endpoints for admin
app.get('/api/auth/users', (req, res) => {
  res.json(mockUsers);
});

app.post('/api/auth/users', (req, res) => {
  const { 
    username, 
    email, 
    password, 
    firstName, 
    lastName, 
    role, 
    department, 
    phone, 
    timezone, 
    language 
  } = req.body;
  
  // Validate required fields
  if (!username?.trim() || !email?.trim() || !password?.trim() || !firstName?.trim() || !lastName?.trim()) {
    return res.status(400).json({ 
      error: 'Missing required fields: username, email, password, firstName, lastName' 
    });
  }
  
  const newUser = {
    id: Date.now(),
    username,
    email,
    firstName,
    lastName,
    role: role || 'user',
    is_active: true,
    email_verified: false,
    failed_login_attempts: 0,
    locked_until: null,
    department: department || '',
    phone: phone || '',
    timezone: timezone || 'UTC',
    language: language || 'en',
    two_factor_enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null,
    password_changed_at: new Date().toISOString()
  };
  
  // Add to mock users array
  mockUsers.push(newUser);
  
  console.log('Created new user:', newUser);
  console.log('Total users now:', mockUsers.length);
  res.status(201).json(newUser);
});

app.put('/api/auth/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const updates = req.body;
  
  console.log('Updating user:', userId, updates);
  
  // Find and update user in mock array
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const existingUser = mockUsers[userIndex];
  const updatedUser = {
    ...existingUser,
    ...updates,
    id: userId,
    updated_at: new Date().toISOString()
  };
  
  mockUsers[userIndex] = updatedUser;
  
  console.log('Updated user:', updatedUser);
  res.json(updatedUser);
});

app.delete('/api/auth/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Find and remove user from mock array
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const deletedUser = mockUsers.splice(userIndex, 1)[0];
  
  console.log('Deleted user:', deletedUser.username);
  console.log('Total users now:', mockUsers.length);
  res.json({ message: `User ${userId} deleted successfully` });
});

// Advanced user management endpoints
app.get('/api/admin/users/search', (req, res) => {
  const { 
    q = '', 
    role = '', 
    status = 'all', 
    department = '',
    page = 1, 
    limit = 10, 
    sortBy = 'created_at', 
    sortOrder = 'desc' 
  } = req.query;

  // Use shared mock users array
  let users = [...mockUsers];

  // Apply filters
  if (q) {
    const searchTerm = q.toLowerCase();
    users = users.filter(user => 
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.firstName.toLowerCase().includes(searchTerm) ||
      user.lastName.toLowerCase().includes(searchTerm) ||
      user.department.toLowerCase().includes(searchTerm)
    );
  }

  if (role) {
    users = users.filter(user => user.role === role);
  }

  if (department) {
    users = users.filter(user => user.department.toLowerCase().includes(department.toLowerCase()));
  }

  if (status !== 'all') {
    switch (status) {
      case 'active':
        users = users.filter(user => user.is_active && !user.locked_until);
        break;
      case 'inactive':
        users = users.filter(user => !user.is_active);
        break;
      case 'locked':
        users = users.filter(user => user.locked_until && new Date(user.locked_until) > new Date());
        break;
    }
  }

  // Sort users
  users.sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortBy === 'created_at' || sortBy === 'last_login') {
      aVal = new Date(aVal || 0);
      bVal = new Date(bVal || 0);
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedUsers = users.slice(startIndex, endIndex);

  res.json({
    users: paginatedUsers,
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(users.length / limitNum),
      totalUsers: users.length,
      usersPerPage: limitNum
    },
    filters: { q, role, status, department, sortBy, sortOrder }
  });
});

// Bulk operations endpoint
app.post('/api/admin/users/bulk', (req, res) => {
  const { userIds, operation, parameters } = req.body;
  
  console.log('Bulk operation:', operation, 'on users:', userIds, 'with parameters:', parameters);
  
  let operationMessage = '';
  switch (operation) {
    case 'activate':
      operationMessage = 'activated';
      break;
    case 'deactivate':
      operationMessage = 'deactivated';
      break;
    case 'lock':
      operationMessage = 'locked';
      break;
    case 'unlock':
      operationMessage = 'unlocked';
      break;
    case 'reset-password':
      operationMessage = 'password reset sent';
      break;
    case 'verify-email':
      operationMessage = 'email verified';
      break;
    case 'unverify-email':
      operationMessage = 'email unverified';
      break;
    case 'delete':
      operationMessage = 'deleted';
      break;
    default:
      operationMessage = 'processed';
  }
  
  // Handle delete operations separately to avoid index issues
  if (operation === 'delete') {
    const results = [];
    let deletedCount = 0;
    
    for (const id of userIds) {
      const userIndex = mockUsers.findIndex(user => user.id === id);
      if (userIndex === -1) {
        results.push({
          userId: id,
          success: false,
          message: `User ${id} not found`
        });
      } else {
        const userToDelete = mockUsers[userIndex];
        mockUsers.splice(userIndex, 1);
        results.push({
          userId: id,
          success: true,
          message: `User ${id} (${userToDelete.username}) deleted successfully`
        });
        console.log('Bulk deleted user:', userToDelete.username);
        deletedCount++;
      }
    }
    
    console.log('Total users deleted:', deletedCount);
    console.log('Total users remaining:', mockUsers.length);
    
    res.json({
      operation,
      results,
      summary: {
        total: userIds.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      },
      message: `Bulk ${operation} completed: ${deletedCount} users deleted successfully`
    });
    return;
  }

  // Handle other operations (activate, deactivate, lock, unlock, reset-password)
  const results = userIds.map(id => {
    const userIndex = mockUsers.findIndex(user => user.id === id);
    if (userIndex === -1) {
      return {
        userId: id,
        success: false,
        message: `User ${id} not found`
      };
    }

    let success = true;
    let message = '';

    switch (operation) {
      case 'activate':
        mockUsers[userIndex].is_active = true;
        message = `User ${id} activated successfully`;
        break;
      case 'deactivate':
        mockUsers[userIndex].is_active = false;
        message = `User ${id} deactivated successfully`;
        break;
      case 'lock':
        mockUsers[userIndex].locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
        message = `User ${id} locked successfully`;
        break;
      case 'unlock':
        mockUsers[userIndex].locked_until = null;
        message = `User ${id} unlocked successfully`;
        break;
      case 'reset-password':
        // In a real system, this would generate and send actual password reset
        message = `Password reset sent to user ${id}`;
        break;
      case 'verify-email':
        mockUsers[userIndex].email_verified = true;
        message = `Email verified for user ${id} by admin override`;
        break;
      case 'unverify-email':
        mockUsers[userIndex].email_verified = false;
        message = `Email unverified for user ${id} by admin override`;
        break;
      default:
        success = false;
        message = `Unknown operation: ${operation}`;
    }

    // Update the updated_at timestamp
    if (success) {
      mockUsers[userIndex].updated_at = new Date().toISOString();
    }

    return {
      userId: id,
      success,
      message
    };
  });

  res.json({
    operation,
    results,
    summary: {
      total: userIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    message: `Bulk ${operation} completed successfully for ${results.length} users`
  });
});

// User statistics endpoint
app.get('/api/admin/users/statistics', (req, res) => {
  const totalUsers = mockUsers.length;
  const activeUsers = mockUsers.filter(user => user.is_active && (!user.locked_until || new Date(user.locked_until) <= new Date())).length;
  const inactiveUsers = mockUsers.filter(user => !user.is_active).length;
  const lockedUsers = mockUsers.filter(user => user.locked_until && new Date(user.locked_until) > new Date()).length;
  const unverifiedEmails = mockUsers.filter(user => !user.email_verified).length;
  const twoFactorEnabled = mockUsers.filter(user => user.two_factor_enabled).length;
  
  const usersByRole = mockUsers.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});
  
  const usersByDepartment = mockUsers.reduce((acc, user) => {
    if (user.department) {
      acc[user.department] = (acc[user.department] || 0) + 1;
    }
    return acc;
  }, {});
  
  res.json({
    totalUsers,
    activeUsers,
    inactiveUsers,
    lockedUsers,
    unverifiedEmails,
    twoFactorEnabled,
    usersByRole,
    usersByDepartment,
    recentActivity: {
      newUsersThisWeek: 0,
      newUsersThisMonth: 2,
      loginsToday: 3,
      loginsThisWeek: 8
    }
  });
});

// User activity log endpoint
app.get('/api/admin/users/:id/activity', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const mockActivity = [
    {
      id: 1,
      action: 'login',
      timestamp: new Date().toISOString(),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: { success: true }
    },
    {
      id: 2,
      action: 'profile_update',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: { fields_updated: ['phone', 'timezone'] }
    },
    {
      id: 3,
      action: 'password_change',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      details: { initiated_by: 'user' }
    }
  ];

  res.json(mockActivity);
});

// Account lock/unlock endpoints
app.post('/api/admin/users/:id/lock', (req, res) => {
  const userId = parseInt(req.params.id);
  const { duration = 30 } = req.body; // duration in minutes
  
  res.json({
    userId,
    locked: true,
    lockedUntil: new Date(Date.now() + duration * 60 * 1000).toISOString(),
    message: `User ${userId} locked for ${duration} minutes`
  });
});

app.post('/api/admin/users/:id/unlock', (req, res) => {
  const userId = parseInt(req.params.id);
  
  res.json({
    userId,
    locked: false,
    lockedUntil: null,
    message: `User ${userId} unlocked successfully`
  });
});

// Email verification override endpoints
app.post('/api/admin/users/:id/verify-email', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex].email_verified = true;
  mockUsers[userIndex].updated_at = new Date().toISOString();
  
  console.log('Admin verified email for user:', mockUsers[userIndex].username);
  res.json({
    userId,
    email_verified: true,
    message: `Email verified for user ${userId} by admin override`
  });
});

app.post('/api/admin/users/:id/unverify-email', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex].email_verified = false;
  mockUsers[userIndex].updated_at = new Date().toISOString();
  
  console.log('Admin unverified email for user:', mockUsers[userIndex].username);
  res.json({
    userId,
    email_verified: false,
    message: `Email unverified for user ${userId} by admin override`
  });
});

// User activation/deactivation endpoints
app.post('/api/admin/users/:id/activate', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex].is_active = true;
  mockUsers[userIndex].updated_at = new Date().toISOString();
  
  console.log('Activated user:', mockUsers[userIndex].username);
  res.json({
    userId,
    is_active: true,
    message: `User ${userId} activated successfully`
  });
});

app.post('/api/admin/users/:id/deactivate', (req, res) => {
  const userId = parseInt(req.params.id);
  
  const userIndex = mockUsers.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  mockUsers[userIndex].is_active = false;
  mockUsers[userIndex].updated_at = new Date().toISOString();
  
  console.log('Deactivated user:', mockUsers[userIndex].username);
  res.json({
    userId,
    is_active: false,
    message: `User ${userId} deactivated successfully`
  });
});

// Password reset endpoint
app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const userId = parseInt(req.params.id);
  const { sendEmail = true, requireChange = true } = req.body;
  
  res.json({
    userId,
    temporaryPassword: 'TempPass123!',
    passwordResetSent: sendEmail,
    requirePasswordChange: requireChange,
    message: 'Password reset successfully'
  });
});

// Export users endpoint
app.post('/api/admin/users/export', (req, res) => {
  const { format = 'csv', filters = {} } = req.body;
  
  res.json({
    downloadUrl: `/api/admin/users/export/download/${Date.now()}.${format}`,
    fileName: `users_export_${new Date().toISOString().split('T')[0]}.${format}`,
    recordCount: 5,
    message: 'Export prepared successfully'
  });
});

// User settings endpoint
app.get('/api/user/settings', (req, res) => {
  res.json({
    id: 1,
    user_id: 1,
    openai_api_key: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
});

app.put('/api/user/settings', (req, res) => {
  res.json({
    id: 1,
    user_id: 1,
    ...req.body,
    updated_at: new Date().toISOString()
  });
});

// In-memory batch storage for mock server
let mockBatches = [
  {
    id: 1,
    batchNumber: 'BB-001',
    startDate: '2025-08-12',
    brewSize: 5.5,
    teaType: 'Custom Blend',
    sugarType: 'Cane',
    startPH: 3.6,
    startBrix: 10,
    status: 'in-progress',
    progressPercentage: 25,
    lastEntryDate: new Date().toISOString(),
    starterVolume: 16,
    teaWeight: 2,
    waterVolume: 1,
    sugarAmount: 1,
    created_at: new Date().toISOString(),
    teaBlendNotes: '50/50',
    teaSteepingTemp: 190,
    teaSteepingTime: 25,
    teaAmountGrams: 11,
    starterTea: 256,
    sugarUsed: 7
  },
  {
    id: 2,
    batchNumber: 'BB-002',
    startDate: '2025-08-12',
    brewSize: 7,
    teaType: 'Custom Blend',
    sugarType: 'Cane',
    startPH: 2.8,
    startBrix: 8.5,
    status: 'in-progress',
    progressPercentage: 25,
    lastEntryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    starterVolume: 8,
    teaWeight: 1,
    waterVolume: 0.5,
    sugarAmount: 0.5,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    teaBlendNotes: '50/50',
    teaSteepingTemp: 190,
    teaSteepingTime: 25,
    teaAmountGrams: 130,
    starterTea: 128,
    sugarUsed: 7,
    tasteProfile: 'Sour + Balanced'
  }
];

// Batches endpoints
app.get('/api/batches', (req, res) => {
  res.json(mockBatches);
});

app.get('/api/batches/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const batch = mockBatches.find(b => b.id === id);
  
  if (batch) {
    res.json(batch);
  } else {
    res.status(404).json({ error: 'Batch not found' });
  }
});

app.post('/api/batches', (req, res) => {
  const newBatch = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString(),
    lastEntryDate: req.body.lastEntryDate || new Date().toISOString()
  };
  
  // Add to mock storage
  mockBatches.push(newBatch);
  console.log('Created new batch:', newBatch);
  
  res.status(201).json(newBatch);
});

app.put('/api/batches/:id', (req, res) => {
  const batchId = parseInt(req.params.id);
  console.log(`\n=== PUT /api/batches/${batchId} ===`);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const batchIndex = mockBatches.findIndex(b => b.id === batchId);
  if (batchIndex === -1) {
    console.log('ERROR: Batch not found');
    return res.status(404).json({ error: 'Batch not found' });
  }
  
  console.log('Current batch:', JSON.stringify(mockBatches[batchIndex], null, 2));
  
  // Update the batch while preserving existing data
  const updatedBatch = {
    ...mockBatches[batchIndex],
    ...req.body,
    id: batchId, // Ensure ID doesn't change
    updated_at: new Date().toISOString()
  };
  
  mockBatches[batchIndex] = updatedBatch;
  console.log('Updated batch result:', JSON.stringify(updatedBatch, null, 2));
  console.log('=== END PUT ===\n');
  
  res.json(updatedBatch);
});

app.delete('/api/batches/:id', (req, res) => {
  const batchId = parseInt(req.params.id);
  console.log(`Deleting batch with ID: ${batchId}`);
  
  const batchIndex = mockBatches.findIndex(b => b.id === batchId);
  if (batchIndex === -1) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  
  const deletedBatch = mockBatches.splice(batchIndex, 1)[0];
  console.log('Deleted batch:', deletedBatch.batchNumber);
  
  res.json({
    success: true,
    message: `Batch ${deletedBatch.batchNumber} deleted successfully`,
    deleted_at: new Date().toISOString()
  });
});

// Mock endpoints for other services
app.get('/api/recipes', (req, res) => {
  res.json([
    {
      id: 1,
      name: 'Classic Green Tea Kombucha',
      tea_type: 'Green Tea',
      fermentation_days: 7,
      is_favorite: true,
      is_public: false
    }
  ]);
});

app.get('/api/equipment', (req, res) => {
  res.json([
    {
      id: 1,
      name: '1 Gallon Glass Jar',
      type: 'fermentation_vessel',
      capacity: 1.0,
      is_active: true,
      last_sanitized: '2024-01-15T08:00:00Z'
    }
  ]);
});

// Get all intervals
app.get('/api/intervals', (req, res) => {
  console.log('\n=== GET /api/intervals ===');
  console.log('Returning all intervals:', mockIntervals.length);
  res.json(mockIntervals);
});

app.get('/api/intervals/batch/:batchId', (req, res) => {
  const batchId = parseInt(req.params.batchId);
  const batchIntervals = mockIntervals.filter(interval => interval.batch_id === batchId);
  
  // If no intervals exist, return sample data
  if (batchIntervals.length === 0) {
    const sampleInterval = {
      id: 1,
      batch_id: batchId,
      recorded_at: new Date().toISOString().split('T')[0],
      ph_level: 4.2,
      brix_level: 6.8,
      temperature: 72.5,
      taste_notes: 'Slightly tart, good carbonation building',
      ai_analysis: 'pH levels look healthy for fermentation. Temperature is optimal for active fermentation.',
      health_score: 85,
      recommendations: ['Continue monitoring - fermentation progressing well']
    };
    res.json([sampleInterval]);
  } else {
    // Enrich intervals with their AI analysis data
    const enrichedIntervals = batchIntervals.map(interval => {
      const relatedAnalysis = mockAIAnalyses.find(analysis => 
        analysis.batch_id === interval.batch_id && 
        Math.abs(new Date(analysis.analyzed_at) - new Date(interval.created_at)) < 60000 // Within 1 minute
      );
      
      return {
        ...interval,
        ai_analysis: relatedAnalysis?.insights,
        health_score: relatedAnalysis?.health_score,
        recommendations: relatedAnalysis?.recommendations
      };
    });
    
    console.log(`Retrieved ${enrichedIntervals.length} intervals for batch ${batchId}`);
    res.json(enrichedIntervals);
  }
});

// In-memory interval storage
let mockIntervals = [
  {
    id: 1,
    batch_id: 1,
    recorded_at: '2025-08-12',
    ph_level: 4.2,
    brix_level: 8.5,
    temperature: 72.0,
    taste_notes: 'Slightly sweet, good carbonation building',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    batch_id: 1,
    recorded_at: '2025-08-13',
    ph_level: 3.8,
    brix_level: 6.2,
    temperature: 74.0,
    taste_notes: 'More tart, carbonation increasing',
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    batch_id: 2,
    recorded_at: '2025-08-12',
    ph_level: 3.9,
    brix_level: 7.8,
    temperature: 73.5,
    taste_notes: 'Good balance, progressing well',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// In-memory AI analysis storage
let mockAIAnalyses = [
  {
    id: 1,
    batch_id: 1,
    insights: 'pH levels are progressing well from 4.2 to 3.8. Brix reduction indicates active fermentation. Temperature is optimal for continued fermentation.',
    recommendations: ['Continue monitoring daily', 'Check for proper carbonation development', 'Consider taste testing in 2-3 days'],
    health_score: 88,
    analyzed_data: { ph_level: 3.8, brix_level: 6.2, temperature: 74.0 },
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    batch_id: 2,
    insights: 'Single data point shows healthy pH of 3.9 and good sugar content at 7.8 Brix. Temperature is ideal for fermentation.',
    recommendations: ['Add second measurement tomorrow', 'Monitor carbonation levels', 'Check SCOBY formation'],
    health_score: 85,
    analyzed_data: { ph_level: 3.9, brix_level: 7.8, temperature: 73.5 },
    analyzed_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
];

// In-memory photo storage
let mockPhotos = [];

// In-memory chat conversations and messages storage
let mockConversations = [
  {
    id: 1,
    user_id: '1',
    title: 'Brewing Tips Discussion',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];
let mockMessages = [
  {
    id: 1,
    conversation_id: 1,
    role: 'assistant',
    content: 'Hello! I\'m your AI brewing assistant. How can I help you with your kombucha brewing today?',
    created_at: new Date().toISOString()
  }
];

app.post('/api/intervals', (req, res) => {
  console.log('\n=== POST /api/intervals ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const intervalData = {
    id: Date.now(),
    ...req.body,
    created_at: new Date().toISOString()
  };
  
  // Add to mock storage
  mockIntervals.push(intervalData);
  
  console.log('Created new interval data:', JSON.stringify(intervalData, null, 2));
  console.log('Total intervals stored:', mockIntervals.length);
  console.log('=== END POST intervals ===\n');
  
  res.status(201).json(intervalData);
});

// Update interval
app.put('/api/intervals/:id', (req, res) => {
  console.log('\n=== PUT /api/intervals/:id ===');
  const intervalId = parseInt(req.params.id);
  console.log('Updating interval ID:', intervalId);
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const intervalIndex = mockIntervals.findIndex(interval => interval.id === intervalId);
  
  if (intervalIndex === -1) {
    console.log('Interval not found');
    return res.status(404).json({ error: 'Interval not found' });
  }
  
  // Update the interval
  const updatedInterval = {
    ...mockIntervals[intervalIndex],
    ...req.body,
    updated_at: new Date().toISOString()
  };
  
  mockIntervals[intervalIndex] = updatedInterval;
  
  console.log('Updated interval:', JSON.stringify(updatedInterval, null, 2));
  console.log('=== END PUT intervals ===\n');
  
  res.json(updatedInterval);
});

// Delete interval
app.delete('/api/intervals/:id', (req, res) => {
  console.log('\n=== DELETE /api/intervals/:id ===');
  const intervalId = parseInt(req.params.id);
  console.log('Deleting interval ID:', intervalId);
  
  const intervalIndex = mockIntervals.findIndex(interval => interval.id === intervalId);
  
  if (intervalIndex === -1) {
    console.log('Interval not found');
    return res.status(404).json({ error: 'Interval not found' });
  }
  
  // Remove the interval
  const deletedInterval = mockIntervals.splice(intervalIndex, 1)[0];
  
  console.log('Deleted interval:', JSON.stringify(deletedInterval, null, 2));
  console.log('Total intervals remaining:', mockIntervals.length);
  console.log('=== END DELETE intervals ===\n');
  
  res.json({ 
    message: 'Interval deleted successfully',
    deleted_interval: deletedInterval
  });
});

app.post('/api/ai/analyze-progress/:batchId', (req, res) => {
  const batchId = req.params.batchId;
  const data = req.body;
  
  console.log(`\n=== POST /api/ai/analyze-progress/${batchId} ===`);
  console.log('AI analyzing progress data:', JSON.stringify(data, null, 2));
  
  // Mock AI analysis based on the data provided
  let insights = '';
  let recommendations = [];
  let healthScore = 85;
  
  if (data.ph_level) {
    if (data.ph_level < 3.5) {
      insights += 'pH is quite low, indicating strong acidity. ';
      recommendations.push('Monitor for over-fermentation');
      healthScore -= 10;
    } else if (data.ph_level > 5.0) {
      insights += 'pH is elevated, fermentation may be slow. ';
      recommendations.push('Check SCOBY health and temperature');
      healthScore -= 15;
    } else {
      insights += 'pH levels look healthy for fermentation. ';
    }
  }
  
  if (data.brix_level) {
    if (data.brix_level < 4) {
      insights += 'Low sugar content suggests fermentation is progressing well. ';
      recommendations.push('Consider testing for alcohol content');
    } else if (data.brix_level > 10) {
      insights += 'High sugar content indicates early fermentation stage. ';
      recommendations.push('Continue monitoring - expect more activity');
    }
  }
  
  if (data.temperature) {
    if (data.temperature < 68) {
      insights += 'Temperature is low - fermentation may be slow. ';
      recommendations.push('Consider moving to warmer location');
      healthScore -= 5;
    } else if (data.temperature > 78) {
      insights += 'Temperature is high - risk of off-flavors. ';
      recommendations.push('Move to cooler location');
      healthScore -= 10;
    }
  }
  
  if (!insights) {
    insights = 'Fermentation parameters look balanced. Continue monitoring progress.';
  }
  
  const analysis = {
    id: Date.now(),
    batch_id: parseInt(batchId),
    insights,
    recommendations,
    health_score: healthScore,
    analyzed_data: data,
    analyzed_at: new Date().toISOString(),
    created_at: new Date().toISOString()
  };
  
  // Save AI analysis to storage
  mockAIAnalyses.push(analysis);
  
  console.log('AI Analysis result saved:', JSON.stringify(analysis, null, 2));
  console.log('Total AI analyses stored:', mockAIAnalyses.length);
  console.log('=== END POST AI analysis ===\n');
  
  res.json(analysis);
});

// Get all AI analyses for a batch
app.get('/api/ai/analyses/batch/:batchId', (req, res) => {
  const batchId = parseInt(req.params.batchId);
  const batchAnalyses = mockAIAnalyses.filter(analysis => analysis.batch_id === batchId);
  
  console.log(`Retrieved ${batchAnalyses.length} AI analyses for batch ${batchId}`);
  res.json(batchAnalyses);
});

// Get specific AI analysis by ID
app.get('/api/ai/analyses/:analysisId', (req, res) => {
  const analysisId = parseInt(req.params.analysisId);
  const analysis = mockAIAnalyses.find(a => a.id === analysisId);
  
  if (analysis) {
    res.json(analysis);
  } else {
    res.status(404).json({ error: 'AI analysis not found' });
  }
});

// Get all AI analyses (for admin purposes)
app.get('/api/ai/analyses', (req, res) => {
  console.log(`Retrieved all ${mockAIAnalyses.length} AI analyses`);
  res.json(mockAIAnalyses);
});

app.get('/api/measurements/batch/:batchId', (req, res) => {
  res.json([
    {
      id: 1,
      batch_id: parseInt(req.params.batchId),
      measurement_date: '2024-01-16',
      ph: 4.2,
      brix: 6.8,
      temperature: 22.5,
      specific_gravity: 1.008,
      alcohol_content: 0.8
    }
  ]);
});

// Chat endpoints
app.get('/api/chat/conversations', (req, res) => {
  console.log('GET /api/chat/conversations - returning', mockConversations.length, 'conversations');
  res.json(mockConversations);
});

app.post('/api/chat/conversations', (req, res) => {
  const { title, batch_id } = req.body;
  console.log('POST /api/chat/conversations - creating new conversation:', title);
  
  const newConversation = {
    id: Date.now(),
    user_id: '1',
    batch_id: batch_id || null,
    title: title || 'New Conversation',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  mockConversations.unshift(newConversation);
  console.log('Created conversation:', newConversation);
  console.log('Total conversations:', mockConversations.length);
  
  res.json(newConversation);
});

app.get('/api/chat/conversations/:id/messages', (req, res) => {
  const conversationId = parseInt(req.params.id);
  console.log('GET /api/chat/conversations/:id/messages - conversation:', conversationId);
  
  let messages = mockMessages.filter(m => m.conversation_id === conversationId);
  
  // If no messages exist for this conversation, add a welcome message
  if (messages.length === 0 && mockConversations.find(c => c.id === conversationId)) {
    const welcomeMessage = {
      id: Date.now(),
      conversation_id: conversationId,
      role: 'assistant',
      content: 'Hello! I\'m your AI brewing assistant. How can I help you with your kombucha brewing today?',
      created_at: new Date().toISOString()
    };
    mockMessages.push(welcomeMessage);
    messages.push(welcomeMessage);
  }
  
  console.log('Returning', messages.length, 'messages for conversation', conversationId);
  res.json(messages);
});

app.post('/api/chat/conversations/:id/messages', (req, res) => {
  const { content } = req.body;
  const conversationId = parseInt(req.params.id);
  console.log('POST /api/chat/conversations/:id/messages - conversation:', conversationId, 'content:', content);
  
  const userMessage = {
    id: Date.now(),
    conversation_id: conversationId,
    role: 'user',
    content: content,
    created_at: new Date().toISOString()
  };
  
  const assistantMessage = {
    id: Date.now() + 1,
    conversation_id: conversationId,
    role: 'assistant',
    content: `Thanks for your message about: "${content}". For kombucha brewing, it's important to maintain proper pH levels (2.5-3.5) and temperature (75-85°F) for optimal fermentation. Would you like specific guidance on this topic?`,
    created_at: new Date().toISOString()
  };
  
  // Store messages
  mockMessages.push(userMessage, assistantMessage);
  
  // Update conversation's updated_at
  const conversation = mockConversations.find(c => c.id === conversationId);
  if (conversation) {
    conversation.updated_at = new Date().toISOString();
  }
  
  console.log('Added 2 new messages. Total messages:', mockMessages.length);
  res.json([userMessage, assistantMessage]);
});

app.delete('/api/chat/conversations/:id', (req, res) => {
  const conversationId = parseInt(req.params.id);
  console.log('DELETE /api/chat/conversations/:id - conversation:', conversationId);
  
  // Remove conversation
  const index = mockConversations.findIndex(c => c.id === conversationId);
  if (index !== -1) {
    mockConversations.splice(index, 1);
  }
  
  // Remove associated messages
  mockMessages = mockMessages.filter(m => m.conversation_id !== conversationId);
  
  console.log('Deleted conversation. Remaining conversations:', mockConversations.length);
  res.json({ message: 'Conversation deleted successfully' });
});

// AI Assistant endpoints
app.post('/api/ai/chat', async (req, res) => {
  const { message, conversationHistory } = req.body;
  
  try {
    if (openaiClient) {
      // Use real OpenAI API
      const messages = [
        {
          role: 'system',
          content: 'You are an expert kombucha brewing assistant. You have extensive knowledge about kombucha fermentation processes, SCOBY care, tea types, sugar ratios, flavor combinations, pH levels, temperature control, timing, food safety, contamination prevention, equipment recommendations, and sanitization. You provide helpful, accurate, and practical advice to kombucha brewers of all skill levels.'
        }
      ];
      
      // Add conversation history if provided
      if (conversationHistory && Array.isArray(conversationHistory)) {
        messages.push(...conversationHistory.slice(-10)); // Keep last 10 messages for context
      }
      
      // Add current message
      messages.push({
        role: 'user',
        content: message
      });
      
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      
      res.json({
        response,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined
      });
      
    } else {
      // Fallback to mock responses when OpenAI is not configured
      let response = "I'm your AI brewing assistant (running in demo mode). ";
      
      if (message.toLowerCase().includes('ph') || message.toLowerCase().includes('acid')) {
        response += "For kombucha, maintain pH between 2.5-3.5 during fermentation. If pH is too high, your SCOBY may not be active enough or contamination could be present.";
      } else if (message.toLowerCase().includes('mold') || message.toLowerCase().includes('contamination')) {
        response += "Mold appears fuzzy and is usually blue, black, or white on top of the SCOBY. If you see mold, discard the entire batch and sanitize everything thoroughly.";
      } else if (message.toLowerCase().includes('temperature') || message.toLowerCase().includes('temp')) {
        response += "Optimal kombucha fermentation temperature is 75-85°F (24-29°C). Higher temperatures speed fermentation but can stress the SCOBY.";
      } else if (message.toLowerCase().includes('flavor') || message.toLowerCase().includes('taste')) {
        response += "For second fermentation flavoring, try fruit juices, fresh herbs, or spices. Add 10-20% fruit juice by volume for good flavor without over-sweetening.";
      } else if (message.toLowerCase().includes('scoby')) {
        response += "A healthy SCOBY should be creamy white to light brown, smooth or bumpy texture is normal. It should smell tangy and yeasty, not putrid.";
      } else {
        response += "I can help with kombucha brewing questions about fermentation, pH levels, SCOBY care, flavoring, troubleshooting, and more. What would you like to know?";
      }
      
      res.json({
        response,
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75
        }
      });
    }
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({
      response: 'Sorry, I encountered an error while processing your request. Please try again.',
      error: 'AI service temporarily unavailable'
    });
  }
});

app.post('/api/ai/tips/:batchId', (req, res) => {
  const batchId = req.params.batchId;
  
  const tips = `Tips for Batch BB-${String(batchId).padStart(3, '0')}:
• Monitor pH daily - should drop to 2.5-3.5 range
• Taste test after day 7 for desired tartness
• Green tea batches typically ferment faster than black tea
• Keep temperature consistent between 75-80°F for optimal results`;
  
  res.json({ tips });
});

app.post('/api/ai/troubleshoot/:batchId', (req, res) => {
  const { issue } = req.body;
  const batchId = req.params.batchId;
  
  let advice = `Troubleshooting advice for Batch BB-${String(batchId).padStart(3, '0')}:\n\n`;
  
  if (issue.toLowerCase().includes('slow')) {
    advice += "For slow fermentation:\n• Check temperature - should be 75-85°F\n• Ensure SCOBY is healthy and active\n• Add starter tea from previous batch\n• Consider the tea type - some ferment slower";
  } else if (issue.toLowerCase().includes('too sour') || issue.toLowerCase().includes('acidic')) {
    advice += "For overly sour kombucha:\n• Reduce fermentation time\n• Check temperature - high temps accelerate souring\n• Use less starter tea next time\n• Harvest earlier in the process";
  } else if (issue.toLowerCase().includes('sweet')) {
    advice += "For kombucha that's too sweet:\n• Extend fermentation time\n• Check SCOBY health and activity\n• Ensure proper starter tea ratio\n• Monitor pH - should be below 3.5";
  } else {
    advice += "General troubleshooting steps:\n• Check pH levels\n• Monitor temperature consistency\n• Inspect SCOBY for health\n• Review fermentation timeline\n• Consider environmental factors";
  }
  
  res.json({ advice });
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    configured: !!openaiClient,
    status: openaiClient ? 'ready' : 'mock_mode',
    message: openaiClient 
      ? 'AI service is ready with OpenAI integration' 
      : 'Running in mock mode - add OPENAI_API_KEY for real AI responses'
  });
});

// Photo Upload API Endpoints

// Upload photo for a batch
app.post('/api/batches/:batchId/photos', upload.single('photo'), (req, res) => {
  console.log('\n=== POST /api/batches/:batchId/photos ===');
  const batchId = parseInt(req.params.batchId);
  
  if (!req.file) {
    return res.status(400).json({ error: 'No photo file provided' });
  }

  console.log('File uploaded:', req.file.filename);
  console.log('Upload data:', req.body);

  const photoData = {
    id: Date.now(),
    batch_id: batchId,
    photo_url: `http://localhost:5000/uploads/${req.file.filename}`,
    filename: req.file.filename,
    original_name: req.file.originalname,
    photo_type: req.body.photo_type || 'general',
    caption: req.body.caption || '',
    file_size: req.file.size,
    mime_type: req.file.mimetype,
    created_at: new Date().toISOString()
  };

  mockPhotos.push(photoData);
  console.log('Photo saved:', photoData);
  console.log('Total photos stored:', mockPhotos.length);

  res.json(photoData);
});

// Get photos for a specific batch
app.get('/api/batches/:batchId/photos', (req, res) => {
  console.log('\n=== GET /api/batches/:batchId/photos ===');
  const batchId = parseInt(req.params.batchId);
  
  const batchPhotos = mockPhotos.filter(photo => photo.batch_id === batchId);
  console.log(`Found ${batchPhotos.length} photos for batch ${batchId}`);
  
  res.json(batchPhotos);
});

// Get specific photo
app.get('/api/photos/:photoId', (req, res) => {
  console.log('\n=== GET /api/photos/:photoId ===');
  const photoId = parseInt(req.params.photoId);
  
  const photo = mockPhotos.find(p => p.id === photoId);
  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  res.json(photo);
});

// Delete photo
app.delete('/api/photos/:photoId', (req, res) => {
  console.log('\n=== DELETE /api/photos/:photoId ===');
  const photoId = parseInt(req.params.photoId);
  
  const photoIndex = mockPhotos.findIndex(p => p.id === photoId);
  if (photoIndex === -1) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const photo = mockPhotos[photoIndex];
  
  // Delete file from disk
  try {
    const filePath = path.join(uploadsDir, photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted from disk:', photo.filename);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }

  // Remove from memory
  mockPhotos.splice(photoIndex, 1);
  console.log('Photo deleted:', photoId);
  console.log('Total photos remaining:', mockPhotos.length);

  res.json({ message: 'Photo deleted successfully' });
});

// Get all photos (for admin)
app.get('/api/photos', (req, res) => {
  console.log('\n=== GET /api/photos ===');
  console.log(`Returning all ${mockPhotos.length} photos`);
  res.json(mockPhotos);
});

// Catch-all for unimplemented endpoints
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found in mock server' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Booch Buddy API server running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔓 Login with any username/password`);
});