// Auth service using the real API
import { apiAuthService } from './apiAuth';
import { User, LoginCredentials } from '../types/auth';

export const authService = {
  login: (credentials: LoginCredentials) => apiAuthService.login(credentials),
  logout: () => apiAuthService.logout(),
  getCurrentUser: () => apiAuthService.getCurrentUser(),
  getAllUsers: () => apiAuthService.getAllUsers(),
  createUser: (userData: any) => apiAuthService.createUser(userData),
  updateUser: (userId: string, userData: any) => apiAuthService.updateUser(parseInt(userId), userData),
  deleteUser: (userId: string) => apiAuthService.deleteUser(parseInt(userId)),
  changePassword: (currentPassword: string, newPassword: string) => 
    apiAuthService.changePassword(currentPassword, newPassword)
};