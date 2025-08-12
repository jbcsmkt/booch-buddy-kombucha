// Wrapper to bridge existing components with new MySQL API
import { apiDatabaseService } from './apiDatabase';
import { BatchData } from '../types/brewing';

export const batchService = {
  async getAll(): Promise<BatchData[]> {
    return await apiDatabaseService.getAllBatches();
  },

  async getById(id: string | number): Promise<BatchData | null> {
    return await apiDatabaseService.getBatchById(id);
  },

  async create(batchData: Omit<BatchData, 'id'>): Promise<BatchData> {
    return await apiDatabaseService.createBatch(batchData);
  },

  async update(id: string | number, batchData: Partial<BatchData>): Promise<BatchData> {
    return await apiDatabaseService.updateBatch(id, batchData);
  },

  async delete(id: string | number): Promise<void> {
    return await apiDatabaseService.deleteBatch(id);
  }
};

// Placeholder for user settings service
export const userSettingsService = {
  async get(_userId?: string): Promise<any> {
    try {
      return await apiDatabaseService.getUserSettings();
    } catch (error) {
      // Return default settings if service not available
      return {
        id: '1',
        user_id: '1',
        openai_api_key: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  },

  async update(_userId: string, settings: any): Promise<any> {
    try {
      return await apiDatabaseService.updateUserSettings(settings);
    } catch (error) {
      console.warn('User settings update not available yet');
      return settings;
    }
  },

  async upsert(settings: any): Promise<any> {
    try {
      return await apiDatabaseService.updateUserSettings(settings);
    } catch (error) {
      console.warn('User settings upsert not available yet');
      return settings;
    }
  }
};