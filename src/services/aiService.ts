import { apiClient } from '../config/api';

export interface AIResponse {
  response: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AIStatus {
  configured: boolean;
  status: string;
  message: string;
}

class AIService {
  async chat(message: string, conversationHistory: any[] = [], batchId?: string): Promise<AIResponse> {
    try {
      const response = await apiClient.post<AIResponse>('/ai/chat', {
        message,
        conversationHistory,
        batchId
      });
      return response;
    } catch (error) {
      console.error('AI chat error:', error);
      throw error;
    }
  }

  async generateTips(batchId: number): Promise<string> {
    try {
      const response = await apiClient.post<{ tips: string }>(`/ai/tips/${batchId}`);
      return response.tips;
    } catch (error) {
      console.error('AI tips generation error:', error);
      throw error;
    }
  }

  async troubleshootBatch(batchId: number, issue: string): Promise<string> {
    try {
      const response = await apiClient.post<{ advice: string }>(`/ai/troubleshoot/${batchId}`, {
        issue
      });
      return response.advice;
    } catch (error) {
      console.error('AI troubleshooting error:', error);
      throw error;
    }
  }

  async getStatus(): Promise<AIStatus> {
    try {
      const response = await apiClient.get<AIStatus>('/ai/status');
      return response;
    } catch (error) {
      console.error('AI status check error:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();