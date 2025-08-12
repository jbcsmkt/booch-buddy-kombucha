import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Plus, Filter, Download, MoreHorizontal, 
  Lock, Unlock, RefreshCw, Edit, Trash2, Mail, Shield, 
  Eye, Clock, UserCheck, UserX, AlertTriangle, X
} from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'moderator' | 'user';
  is_active: boolean;
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: string | null;
  department: string;
  phone: string;
  timezone: string;
  language: string;
  two_factor_enabled: boolean;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  password_changed_at: string;
}

interface UserSearchFilters {
  q: string;
  role: string;
  status: string;
  department: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  unverifiedEmails: number;
  twoFactorEnabled: number;
  usersByRole: Record<string, number>;
  usersByDepartment: Record<string, number>;
  recentActivity: {
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    loginsToday: number;
    loginsThisWeek: number;
  };
}

interface CreateUserForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'moderator' | 'user';
  department: string;
  phone: string;
  timezone: string;
  language: string;
}

export const EnhancedUserAdministration: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [createUserForm, setCreateUserForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    department: '',
    phone: '',
    timezone: 'UTC',
    language: 'en'
  });

  const [filters, setFilters] = useState<UserSearchFilters>({
    q: '',
    role: '',
    status: 'all',
    department: '',
    page: 1,
    limit: 10,
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 10
  });

  useEffect(() => {
    loadUsers();
    loadStatistics();
  }, [filters]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const loadUsers = async () => {
    console.log('Loading users...');
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams({
        q: filters.q,
        role: filters.role,
        status: filters.status,
        department: filters.department,
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      const response = await fetch(`http://localhost:5000/api/admin/users/search?${queryParams}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      console.log('Loaded users:', data);
      setUsers(data.users || []);
      setPagination(data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalUsers: 0,
        usersPerPage: 10
      });
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users/statistics', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const stats = await response.json();
        setStatistics(stats);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, q: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof UserSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleUserSelect = (userId: number, selected: boolean) => {
    if (selected) {
      setSelectedUsers(prev => [...prev, userId]);
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedUsers(users.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleBulkAction = async (action: string, parameters?: any) => {
    if (selectedUsers.length === 0) return;

    let confirmMessage = '';
    switch (action) {
      case 'activate':
        confirmMessage = `Are you sure you want to activate ${selectedUsers.length} user(s)?`;
        break;
      case 'deactivate':
        confirmMessage = `Are you sure you want to deactivate ${selectedUsers.length} user(s)?`;
        break;
      case 'lock':
        confirmMessage = `Are you sure you want to lock ${selectedUsers.length} user account(s)?`;
        break;
      case 'unlock':
        confirmMessage = `Are you sure you want to unlock ${selectedUsers.length} user account(s)?`;
        break;
      case 'reset-password':
        confirmMessage = `Are you sure you want to reset passwords for ${selectedUsers.length} user(s)? Password reset emails will be sent.`;
        break;
      case 'verify-email':
        confirmMessage = `Are you sure you want to mark ${selectedUsers.length} user email(s) as verified via admin override?`;
        break;
      case 'unverify-email':
        confirmMessage = `Are you sure you want to mark ${selectedUsers.length} user email(s) as unverified via admin override?`;
        break;
      case 'delete':
        confirmMessage = `Are you sure you want to DELETE ${selectedUsers.length} user(s)? This action cannot be undone.`;
        break;
      default:
        confirmMessage = `Are you sure you want to perform this action on ${selectedUsers.length} user(s)?`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userIds: selectedUsers,
          operation: action,
          parameters
        })
      });

      if (response.ok) {
        const result = await response.json();
        await loadUsers();
        await loadStatistics();
        setSelectedUsers([]);
        setShowBulkActions(false);
        showNotification('success', result.message || `Bulk ${action} completed successfully`);
      } else {
        throw new Error(`Bulk ${action} failed`);
      }
    } catch (error) {
      console.error('Bulk action failed:', error);
      showNotification('error', `Failed to perform bulk ${action}`);
    }
  };

  const handleCreateUser = async () => {
    if (createUserForm.password !== createUserForm.confirmPassword) {
      showNotification('error', 'Passwords do not match');
      return;
    }

    if (!createUserForm.username || !createUserForm.email || !createUserForm.password || !createUserForm.firstName || !createUserForm.lastName) {
      showNotification('error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: createUserForm.username,
          email: createUserForm.email,
          firstName: createUserForm.firstName,
          lastName: createUserForm.lastName,
          password: createUserForm.password,
          role: createUserForm.role,
          department: createUserForm.department,
          phone: createUserForm.phone,
          timezone: createUserForm.timezone,
          language: createUserForm.language
        })
      });

      if (response.ok) {
        await loadUsers();
        await loadStatistics();
        setShowCreateUser(false);
        setCreateUserForm({
          username: '',
          email: '',
          firstName: '',
          lastName: '',
          password: '',
          confirmPassword: '',
          role: 'user',
          department: '',
          phone: '',
          timezone: 'UTC',
          language: 'en'
        });
        showNotification('success', 'User created successfully');
      } else {
        throw new Error('Failed to create user');
      }
    } catch (error) {
      console.error('Create user failed:', error);
      showNotification('error', 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      const response = await fetch(`http://localhost:5000/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        await loadUsers();
        await loadStatistics();
        setEditingUser(null);
        showNotification('success', 'User updated successfully');
      } else {
        throw new Error('Failed to update user');
      }
    } catch (error) {
      console.error('Update user failed:', error);
      showNotification('error', 'Failed to update user');
    }
  };

  const handleUserAction = async (userId: number, action: string, parameters?: any) => {
    try {
      let endpoint = '';
      let method = 'POST';
      let successMessage = '';
      
      switch (action) {
        case 'lock':
          endpoint = `http://localhost:5000/api/admin/users/${userId}/lock`;
          successMessage = 'User locked successfully';
          break;
        case 'unlock':
          endpoint = `http://localhost:5000/api/admin/users/${userId}/unlock`;
          successMessage = 'User unlocked successfully';
          break;
        case 'reset-password':
          endpoint = `http://localhost:5000/api/admin/users/${userId}/reset-password`;
          successMessage = 'Password reset email sent';
          break;
        case 'verify-email':
          endpoint = `http://localhost:5000/api/admin/users/${userId}/verify-email`;
          successMessage = 'Email verified by admin override';
          break;
        case 'unverify-email':
          endpoint = `http://localhost:5000/api/admin/users/${userId}/unverify-email`;
          successMessage = 'Email unverified by admin override';
          break;
        case 'delete':
          if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
          }
          endpoint = `http://localhost:5000/api/auth/users/${userId}`;
          method = 'DELETE';
          successMessage = 'User deleted successfully';
          break;
        default:
          return;
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: parameters ? JSON.stringify(parameters) : undefined
      });

      if (response.ok) {
        await loadUsers();
        await loadStatistics();
        showNotification('success', successMessage);
      } else {
        throw new Error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error('User action failed:', error);
      showNotification('error', `Failed to ${action} user`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'moderator': return 'bg-yellow-100 text-yellow-800';
      case 'user': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center gap-1">
        <Lock size={12} /> Locked
      </span>;
    }
    if (!user.is_active) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
        <UserX size={12} /> Inactive
      </span>;
    }
    if (!user.email_verified) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
        <AlertTriangle size={12} /> Unverified
      </span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 flex items-center gap-1">
      <UserCheck size={12} /> Active
    </span>;
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <UserCheck size={20} className="text-green-600" />
            ) : (
              <AlertTriangle size={20} className="text-red-600" />
            )}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="ml-2 text-gray-500 hover:text-gray-700">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.totalUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.activeUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Lock className="text-red-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Locked Accounts</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.lockedUsers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Shield className="text-yellow-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">2FA Enabled</p>
                <p className="text-2xl font-semibold text-gray-900">{statistics.twoFactorEnabled}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header and Controls */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
                  showFilters ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Filter size={16} />
                Filters
              </button>
              
              <button
                onClick={() => setShowCreateUser(true)}
                className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium"
              >
                <Plus size={16} />
                Add User
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search users by name, email, or department..."
                value={filters.q}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="locked">Locked</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="Filter by department"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Per Page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-md">
              <span className="text-sm font-medium text-blue-900">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkActions(true)}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Bulk Actions
                </button>
                <button
                  onClick={() => setSelectedUsers([])}
                  className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-brewing-amber focus:ring-brewing-amber"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('username')}
                >
                  User
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_login')}
                >
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="animate-spin text-gray-400 mr-2" size={20} />
                      <span className="text-gray-500">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-brewing-amber focus:ring-brewing-amber"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_login ? (
                        <div className="flex items-center gap-1">
                          <Clock size={12} />
                          {format(new Date(user.last_login), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Edit user"
                        >
                          <Edit size={16} />
                        </button>
                        
                        {user.locked_until && new Date(user.locked_until) > new Date() ? (
                          <button
                            onClick={() => handleUserAction(user.id, 'unlock')}
                            className="text-gray-400 hover:text-green-600"
                            title="Unlock user"
                          >
                            <Unlock size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.id, 'lock')}
                            className="text-gray-400 hover:text-red-600"
                            title="Lock user"
                          >
                            <Lock size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleUserAction(user.id, 'reset-password')}
                          className="text-gray-400 hover:text-yellow-600"
                          title="Reset password"
                        >
                          <Mail size={16} />
                        </button>
                        
                        {user.email_verified ? (
                          <button
                            onClick={() => handleUserAction(user.id, 'unverify-email')}
                            className="text-gray-400 hover:text-orange-600"
                            title="Unverify email (admin override)"
                          >
                            <Shield size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUserAction(user.id, 'verify-email')}
                            className="text-gray-400 hover:text-green-600"
                            title="Verify email (admin override)"
                          >
                            <UserCheck size={16} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleUserAction(user.id, 'delete')}
                          className="text-gray-400 hover:text-red-600"
                          title="Delete user"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.usersPerPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.usersPerPage, pagination.totalUsers)} of{' '}
              {pagination.totalUsers} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => handleFilterChange('page', page)}
                    className={`px-3 py-1 text-sm border rounded ${
                      pagination.currentPage === page
                        ? 'bg-brewing-amber text-white border-brewing-amber'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Bulk Actions</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="p-6 space-y-3">
              <button
                onClick={() => handleBulkAction('activate')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <UserCheck size={16} className="text-green-600" />
                Activate Users
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <UserX size={16} className="text-gray-600" />
                Deactivate Users
              </button>
              <button
                onClick={() => handleBulkAction('lock')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <Lock size={16} className="text-red-600" />
                Lock Accounts
              </button>
              <button
                onClick={() => handleBulkAction('reset-password')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <Mail size={16} className="text-yellow-600" />
                Reset Passwords
              </button>
              <button
                onClick={() => handleBulkAction('verify-email')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <UserCheck size={16} className="text-green-600" />
                Verify Emails (Admin Override)
              </button>
              <button
                onClick={() => handleBulkAction('unverify-email')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <Shield size={16} className="text-orange-600" />
                Unverify Emails (Admin Override)
              </button>
              <button
                onClick={() => handleBulkAction('unlock')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 rounded flex items-center gap-3"
              >
                <Unlock size={16} className="text-green-600" />
                Unlock Accounts
              </button>
              <hr className="my-2" />
              <button
                onClick={() => handleBulkAction('delete')}
                className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 rounded flex items-center gap-3 text-red-600"
              >
                <Trash2 size={16} className="text-red-600" />
                Delete Users (Permanent)
              </button>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowBulkActions(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Create New User</h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.username}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={createUserForm.email}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.firstName}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={createUserForm.lastName}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={createUserForm.password}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={createUserForm.confirmPassword}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={createUserForm.role}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, role: e.target.value as 'admin' | 'moderator' | 'user' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={createUserForm.department}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                    placeholder="Production, Quality Control, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={createUserForm.phone}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                    placeholder="+1-555-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select
                    value={createUserForm.timezone}
                    onChange={(e) => setCreateUserForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg text-sm"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">Edit User</h3>
            </div>
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, username: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingUser.firstName}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingUser.lastName}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, role: e.target.value as 'admin' | 'moderator' | 'user' }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, department: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editingUser.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, is_active: e.target.value === 'active' }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Verification</label>
                  <select
                    value={editingUser.email_verified ? 'verified' : 'unverified'}
                    onChange={(e) => setEditingUser(prev => prev ? ({ ...prev, email_verified: e.target.value === 'verified' }) : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  >
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Admin override for email verification status
                  </p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleEditUser}
                className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg text-sm"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};