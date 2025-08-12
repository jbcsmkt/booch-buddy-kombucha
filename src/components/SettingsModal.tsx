import React, { useState, useEffect } from 'react';
import { X, Key, Save, Users, Lock } from 'lucide-react';
import { userSettingsService } from '../services/database';
import { authService } from '../services/auth';
import { UserSettings } from '../types/brewing';
import { useAuth } from '../contexts/AuthContext';
import { validateApiKey } from '../config/security';
import { EnhancedUserAdministration } from './EnhancedUserAdministration';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'users' | 'password'>('users');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      // For now, we'll use a static user ID. In a real app, this would come from authentication
      const settings: UserSettings | null = await userSettingsService.get('default-user');
      if (settings?.openai_api_key) {
        setApiKey(settings.openai_api_key);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate API key before saving
    if (apiKey && !validateApiKey(apiKey)) {
      alert('Invalid API key format. OpenAI API keys should start with "sk-" and be at least 20 characters long.');
      return;
    }

    setIsSaving(true);
    try {
      await userSettingsService.upsert({
        user_id: 'default-user',
        openai_api_key: apiKey
      });
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save settings: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long and contain uppercase, lowercase, and numbers');
      return;
    }

    // Check for complexity requirements
    const hasUpperCase = /[A-Z]/.test(passwordData.newPassword);
    const hasLowerCase = /[a-z]/.test(passwordData.newPassword);
    const hasNumbers = /\d/.test(passwordData.newPassword);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    try {
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      setPasswordSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to change password');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-7xl mx-4">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Settings & Administration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'api'
                  ? 'border-brewing-amber text-brewing-amber'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Key size={16} className="inline mr-2" />
              API Settings
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'password'
                  ? 'border-brewing-amber text-brewing-amber'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Lock size={16} className="inline mr-2" />
              Change Password
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-brewing-amber text-brewing-amber'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users size={16} className="inline mr-2" />
              User Management
            </button>
          </nav>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {/* API Settings Tab */}
          {activeTab === 'api' && (
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Key className="text-brewing-amber" size={16} />
                  <label className="block text-sm font-medium text-gray-700">
                    OpenAI API Key
                  </label>
                </div>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  placeholder="sk-..."
                  disabled={isLoading}
                  maxLength={51}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Required for AI-powered fermentation analysis. Your key is encrypted and stored securely in the database.
                </p>
                {apiKey && !validateApiKey(apiKey) && (
                  <p className="text-xs text-red-600 mt-1">
                    Invalid API key format. Keys should start with "sk-" and be at least 20 characters long.
                  </p>
                )}
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="font-medium text-blue-800 mb-2">How to get your OpenAI API Key:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
                  <li>Sign in or create an account</li>
                  <li>Click "Create new secret key"</li>
                  <li>Copy the complete key (starts with "sk-") and paste it here</li>
                  <li>Never share your API key with others</li>
                </ol>
              </div>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div className="p-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm">{passwordError}</p>
                  </div>
                )}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm">{passwordSuccess}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Change Password
                </button>
              </form>
            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="p-6">
              <EnhancedUserAdministration />
            </div>
          )}
        </div>

        {activeTab === 'api' && (
          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Settings
                </>
              )}
            </button>
          </div>
        )}

        {(activeTab === 'password' || activeTab === 'users') && (
          <div className="flex justify-end gap-3 p-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            {activeTab === 'users' && (
              <button
                onClick={logout}
                className="bg-brewing-danger hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};