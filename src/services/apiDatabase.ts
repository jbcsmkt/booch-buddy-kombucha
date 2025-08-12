// New MySQL-based database service
import { apiClient, API_ENDPOINTS } from '../config/api';
import { BatchData } from '../types/brewing';

class ApiDatabaseService {
  // Batch operations
  async getAllBatches(): Promise<BatchData[]> {
    return await apiClient.get<BatchData[]>(API_ENDPOINTS.batches);
  }

  async getBatchById(id: string | number): Promise<BatchData | null> {
    try {
      const numId = typeof id === 'string' ? parseInt(id) : id;
      return await apiClient.get<BatchData>(API_ENDPOINTS.batchById(numId));
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createBatch(batchData: Omit<BatchData, 'id' | 'user_id'>): Promise<BatchData> {
    return await apiClient.post<BatchData>(API_ENDPOINTS.batches, batchData);
  }

  async updateBatch(id: string | number, batchData: Partial<BatchData>): Promise<BatchData> {
    const numId = typeof id === 'string' ? parseInt(id.toString()) : id;
    return await apiClient.put<BatchData>(API_ENDPOINTS.batchById(numId), batchData);
  }

  async deleteBatch(id: string | number): Promise<void> {
    const numId = typeof id === 'string' ? parseInt(id.toString()) : id;
    await apiClient.delete(API_ENDPOINTS.batchById(numId));
  }

  async getBatchesByStatus(status: string): Promise<BatchData[]> {
    return await apiClient.get<BatchData[]>(API_ENDPOINTS.batchesByStatus(status));
  }

  async getRecentBatches(limit: number = 10): Promise<BatchData[]> {
    return await apiClient.get<BatchData[]>(API_ENDPOINTS.recentBatches(limit));
  }

  // Batch intervals operations
  async getBatchIntervals(batchId: string | number): Promise<any[]> {
    const numId = typeof batchId === 'string' ? parseInt(batchId) : batchId;
    return await apiClient.get<any[]>(API_ENDPOINTS.intervalsByBatch(numId));
  }

  async createBatchInterval(intervalData: any): Promise<any> {
    return await apiClient.post<any>(API_ENDPOINTS.intervals, intervalData);
  }

  async updateBatchInterval(intervalId: string | number, intervalData: any): Promise<any> {
    const numId = typeof intervalId === 'string' ? parseInt(intervalId) : intervalId;
    return await apiClient.put<any>(API_ENDPOINTS.intervalById(numId), intervalData);
  }

  async deleteBatchInterval(intervalId: string | number): Promise<void> {
    const numId = typeof intervalId === 'string' ? parseInt(intervalId) : intervalId;
    await apiClient.delete(API_ENDPOINTS.intervalById(numId));
  }

  // User settings operations
  async getUserSettings(): Promise<any> {
    return await apiClient.get<any>('/user/settings');
  }

  async updateUserSettings(settings: any): Promise<any> {
    return await apiClient.put<any>('/user/settings', settings);
  }
}

export const apiDatabaseService = new ApiDatabaseService();

// Helper function to check if API is configured
export const isApiConfigured = (): boolean => {
  return true; // Always return true for MySQL API
};