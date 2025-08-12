import bcrypt from 'bcryptjs';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../config/database.js';
import { generateToken, JWTPayload } from '../middleware/auth.js';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
}

export class AuthService {
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Find user by username or email
    const user = await executeQuerySingle<User & { password_hash: string }>(
      `SELECT id, username, email, password_hash, role, is_active, created_at, updated_at, last_login 
       FROM users 
       WHERE (username = ? OR email = ?) AND is_active = TRUE`,
      [username, username]
    );

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await this.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await executeUpdate(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = generateToken(tokenPayload);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      token
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const { username, email, password, role = 'user' } = data;

    // Check if username or email already exists
    const existingUser = await executeQuerySingle(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      throw new Error('Username or email already exists');
    }

    // Validate password strength
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
    
    // Check for complexity requirements
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Insert new user
    const userId = await executeInsert(
      `INSERT INTO users (username, email, password_hash, role) 
       VALUES (?, ?, ?, ?)`,
      [username, email, passwordHash, role]
    );

    // Get the created user
    const user = await executeQuerySingle<User>(
      'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };

    const token = generateToken(tokenPayload);

    return {
      user,
      token
    };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // Get current user
    const user = await executeQuerySingle<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = TRUE',
      [userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await this.verifyPassword(currentPassword, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }
    
    // Check for complexity requirements
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumbers = /\d/.test(newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }

    // Hash new password
    const newPasswordHash = await this.hashPassword(newPassword);

    // Update password
    await executeUpdate(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newPasswordHash, userId]
    );
  }

  async getUserById(userId: number): Promise<User | null> {
    return await executeQuerySingle<User>(
      'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ? AND is_active = TRUE',
      [userId]
    );
  }

  async updateUser(userId: number, data: Partial<{ username: string; email: string; role: string }>): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.username) {
      updates.push('username = ?');
      params.push(data.username);
    }

    if (data.email) {
      updates.push('email = ?');
      params.push(data.email);
    }

    if (data.role) {
      updates.push('role = ?');
      params.push(data.role);
    }

    if (updates.length === 0) {
      return;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(userId);

    await executeUpdate(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  async deactivateUser(userId: number): Promise<void> {
    await executeUpdate(
      'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  async activateUser(userId: number): Promise<void> {
    await executeUpdate(
      'UPDATE users SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [userId]
    );
  }

  async getAllUsers(): Promise<User[]> {
    const users = await executeQuery<User>(
      'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users ORDER BY created_at DESC'
    );
    return users || [];
  }
}