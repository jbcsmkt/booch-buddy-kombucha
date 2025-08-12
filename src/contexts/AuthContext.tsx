import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types/auth';
import { apiAuthService } from '../services/apiAuth';

// Create context with undefined as default to catch missing provider
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        setError(null);
        // Check if user is already authenticated on app start
        const currentUser = apiAuthService.getCurrentUser();
        if (currentUser && apiAuthService.isAuthenticated()) {
          setUser(currentUser);
          // Verify token is still valid by calling /me endpoint
          try {
            const verifiedUser = await apiAuthService.getMe();
            setUser(verifiedUser);
          } catch (error) {
            // Token invalid, clear auth
            await apiAuthService.logout();
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Failed to initialize authentication');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setError(null);
      const userData = await apiAuthService.login(credentials);
      setUser(userData);
      // User data is already stored by apiAuthService
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await apiAuthService.logout();
      setUser(null);
      // User data is already cleared by apiAuthService
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};