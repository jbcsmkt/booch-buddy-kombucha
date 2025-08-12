// Re-export real services from batchServiceWrapper
export { batchService, userSettingsService } from './batchServiceWrapper';

// Re-export placeholder services for components not yet migrated
export * from './placeholderServices';

// Batch interval service using the API
import { apiDatabaseService } from './apiDatabase';

export const batchIntervalService = {
  getByBatchId: (batchId: string | number) => apiDatabaseService.getBatchIntervals(batchId),
  create: (data: any) => apiDatabaseService.createBatchInterval(data),
  update: (id: string | number, data: any) => apiDatabaseService.updateBatchInterval(id, data),
  delete: (id: string | number) => apiDatabaseService.deleteBatchInterval(id)
};