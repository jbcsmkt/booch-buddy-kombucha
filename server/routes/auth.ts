import express from 'express';
import rateLimit from 'express-rate-limit';
import { AuthService } from '../services/authService.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const authService = new AuthService();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Login endpoint
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await authService.login({ username, password });
    
    // Set secure httpOnly cookie instead of sending token in response
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    // Send user data without token
    res.json({ user: result.user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ error: error instanceof Error ? error.message : 'Login failed' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const result = await authService.register({ username, email, password, role });
    
    // Set secure httpOnly cookie
    res.cookie('auth_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(201).json({ user: result.user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Registration failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await authService.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user information' });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to change password' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { username, email } = req.body;
    
    await authService.updateUser(req.user!.id, { username, email });
    
    const updatedUser = await authService.getUserById(req.user!.id);
    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update profile' });
  }
});

// Logout (clear secure cookie)
router.post('/logout', authenticateToken, (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// Admin endpoints
// Get all users (admin only)
router.get('/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await authService.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Create user (admin only)
router.post('/users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username, email, password, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const result = await authService.register({ username, email, password, role });
    res.status(201).json(result.user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create user' });
  }
});

// Update user (admin only)
router.put('/users/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = parseInt(req.params.userId);
    const { username, email, role, is_active } = req.body;
    
    await authService.updateUser(userId, { username, email, role });
    
    // Handle is_active separately if provided
    if (typeof is_active === 'boolean' && !is_active) {
      await authService.deactivateUser(userId);
    } else if (typeof is_active === 'boolean' && is_active) {
      await authService.activateUser(userId);
    }
    
    const updatedUser = await authService.getUserById(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const userId = parseInt(req.params.userId);
    
    // Prevent self-deletion
    if (userId === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    await authService.deactivateUser(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to delete user' });
  }
});

export default router;