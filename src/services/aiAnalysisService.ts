import { AIAnalysis } from '../types/brewing';

export const aiAnalysisService = {
  async getAnalysesForBatch(batchId: string | number): Promise<AIAnalysis[]> {
    const response = await fetch(`http://localhost:5000/api/ai/analyses/batch/${batchId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI analyses');
    }
    
    return response.json();
  },

  async getAnalysisById(analysisId: string | number): Promise<AIAnalysis> {
    const response = await fetch(`http://localhost:5000/api/ai/analyses/${analysisId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI analysis');
    }
    
    return response.json();
  },

  async getAllAnalyses(): Promise<AIAnalysis[]> {
    const response = await fetch('http://localhost:5000/api/ai/analyses', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch all AI analyses');
    }
    
    return response.json();
  }
};