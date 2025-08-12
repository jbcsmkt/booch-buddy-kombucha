// New MySQL-based authentication service
import { apiClient, API_ENDPOINTS } from '../config/api';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
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
  user: User;
  token: string;
}

class ApiAuthService {
  private currentUser: User | null = null;

  constructor() {
    // Load stored user data on initialization (cookies handled automatically)
    const storedUser = localStorage.getItem('current_user');
    if (storedUser) {
      try {
        this.currentUser = JSON.parse(storedUser);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        this.clearAuth();
      }
    }
  }

  private setAuth(user: User): void {
    this.currentUser = user;
    // Token is now handled as httpOnly cookie by server
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  private clearAuth(): void {
    this.currentUser = null;
    localStorage.removeItem('current_user');
    // Cookie will be cleared by server on logout
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await apiClient.post<{user: User}>(API_ENDPOINTS.login, credentials);
      this.setAuth(response.user);
      return response.user;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  async register(data: RegisterData): Promise<User> {
    try {
      const response = await apiClient.post<{user: User}>(API_ENDPOINTS.register, data);
      this.setAuth(response.user);
      return response.user;
    } catch (error) {
      this.clearAuth();
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.isAuthenticated()) {
        await apiClient.post(API_ENDPOINTS.logout);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearAuth();
    }
  }

  async getMe(): Promise<User> {
    const response = await apiClient.get<{ user: User }>(API_ENDPOINTS.me);
    this.currentUser = response.user;
    localStorage.setItem('current_user', JSON.stringify(response.user));
    return response.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post(API_ENDPOINTS.changePassword, {
      currentPassword,
      newPassword
    });
  }

  async updateProfile(data: { username?: string; email?: string }): Promise<User> {
    const response = await apiClient.put<{ user: User }>(API_ENDPOINTS.updateProfile, data);
    this.currentUser = response.user;
    localStorage.setItem('current_user', JSON.stringify(response.user));
    return response.user;
  }

  // Admin functions
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/auth/users');
    return response;
  }

  async createUser(userData: RegisterData): Promise<User> {
    const response = await apiClient.post<User>('/auth/users', userData);
    return response;
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<User> {
    const response = await apiClient.put<User>(`/auth/users/${userId}`, userData);
    return response;
  }

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/auth/users/${userId}`);
  }
}

export const apiAuthService = new ApiAuthService();