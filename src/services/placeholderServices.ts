// Services now connected to real API endpoints
import { apiClient, API_ENDPOINTS } from '../config/api';

export const enhancedMeasurementService = {
  getByBatchId: (batchId: number | string) => {
    const numId = typeof batchId === 'string' ? parseInt(batchId) : batchId;
    return apiClient.get(API_ENDPOINTS.measurementsByBatch(numId));
  },
  create: (data: any) => apiClient.post(API_ENDPOINTS.measurements, data),
  update: (id: number | string, data: any) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.put(API_ENDPOINTS.measurementById(numId), data);
  },
  delete: (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.delete(API_ENDPOINTS.measurementById(numId));
  }
};

export const recipeTemplateService = {
  getAll: (includePublic?: boolean) => {
    const url = includePublic ? `${API_ENDPOINTS.recipes}?includePublic=true` : API_ENDPOINTS.recipes;
    return apiClient.get(url);
  },
  create: (data: any) => apiClient.post(API_ENDPOINTS.recipes, data),
  update: (id: number | string, data: any) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.put(API_ENDPOINTS.recipeById(numId), data);
  },
  delete: (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.delete(API_ENDPOINTS.recipeById(numId));
  }
};

export const batchPhotoService = {
  // Photo upload needs special handling - keeping as placeholder for now
  getByBatchId: (_batchId: any) => Promise.resolve([]),
  create: (_data: any) => Promise.resolve({}),
  delete: (_id: any) => Promise.resolve()
};

export const equipmentService = {
  getAll: (activeOnly?: boolean) => {
    const url = activeOnly ? `${API_ENDPOINTS.equipment}?activeOnly=true` : API_ENDPOINTS.equipment;
    return apiClient.get(url);
  },
  create: (data: any) => apiClient.post(API_ENDPOINTS.equipment, data),
  update: (id: number | string, data: any) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.put(API_ENDPOINTS.equipmentById(numId), data);
  },
  delete: (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.delete(API_ENDPOINTS.equipmentById(numId));
  },
  sanitize: (id: number | string) => {
    const numId = typeof id === 'string' ? parseInt(id) : id;
    return apiClient.patch(API_ENDPOINTS.equipmentSanitize(numId), {});
  }
};

export const chatService = {
  getConversations: () => apiClient.get('/chat/conversations'),
  
  createConversation: (title?: string, batchId?: string) => 
    apiClient.post('/chat/conversations', { title, batch_id: batchId }),
    
  getMessages: (conversationId: number) => 
    apiClient.get(`/chat/conversations/${conversationId}/messages`),
    
  sendMessage: async (conversationId: number, content: string) => {
    try {
      // Import aiService dynamically to avoid circular imports
      const { aiService } = await import('./aiService');
      
      // Get AI response first
      const aiResponse = await aiService.chat(content, [], conversationId.toString());
      
      // Send to mock server which will create both user and assistant messages
      const mockResponse = await apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
      
      // Replace the mock assistant response with the AI response
      if (mockResponse.length >= 2 && mockResponse[1].role === 'assistant') {
        mockResponse[1].content = aiResponse.response;
      }
      
      return mockResponse;
    } catch (error) {
      // Fallback to regular mock response if AI fails
      console.error('AI response failed, using mock:', error);
      return apiClient.post(`/chat/conversations/${conversationId}/messages`, { content });
    }
  },
    
  deleteConversation: (conversationId: number) => 
    apiClient.delete(`/chat/conversations/${conversationId}`)
};