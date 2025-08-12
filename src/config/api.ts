// API Configuration for Booch Buddy
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Authentication
  login: '/auth/login',
  register: '/auth/register',
  me: '/auth/me',
  changePassword: '/auth/change-password',
  updateProfile: '/auth/profile',
  logout: '/auth/logout',

  // Batches
  batches: '/batches',
  batchById: (id: number) => `/batches/${id}`,
  batchesByStatus: (status: string) => `/batches/status/${status}`,
  recentBatches: (limit?: number) => `/batches/recent${limit ? `/${limit}` : ''}`,
  
  // Batch Intervals
  intervals: '/intervals',
  intervalsByBatch: (batchId: number) => `/intervals/batch/${batchId}`,
  intervalById: (id: number) => `/intervals/${id}`,
  
  // Enhanced Measurements
  measurements: '/measurements',
  measurementsByBatch: (batchId: number) => `/measurements/batch/${batchId}`,
  measurementById: (id: number) => `/measurements/${id}`,
  
  // Recipe Templates
  recipes: '/recipes',
  recipeById: (id: number) => `/recipes/${id}`,
  recipeFavorite: (id: number) => `/recipes/${id}/favorite`,
  
  // Equipment
  equipment: '/equipment',
  equipmentById: (id: number) => `/equipment/${id}`,
  equipmentSanitize: (id: number) => `/equipment/${id}/sanitize`,

  // Health check
  health: '/health'
};

// HTTP client helper
class ApiClient {
  private getAuthHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json'
    };
  }

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API POST request:', url, data);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('API PUT request:', url, data);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      console.error('PUT request failed:', error);
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('API PUT response:', result);
    return result;
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      ...(data && { body: JSON.stringify(data) })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}

export const apiClient = new ApiClient();