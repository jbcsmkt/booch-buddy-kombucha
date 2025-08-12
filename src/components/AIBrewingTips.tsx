import React, { useState, useEffect } from 'react';
import { Bot, Lightbulb, AlertCircle, Loader, RefreshCw } from 'lucide-react';
import { aiService } from '../services/aiService';
import type { Batch } from '../types/brewing';

interface AIBrewingTipsProps {
  batch: Batch;
  className?: string;
}

export const AIBrewingTips: React.FC<AIBrewingTipsProps> = ({ batch, className = '' }) => {
  const [tips, setTips] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);

  const checkAIStatus = async () => {
    try {
      const status = await aiService.getStatus();
      setIsConfigured(status.configured);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setIsConfigured(false);
    }
  };

  const generateTips = async () => {
    if (!isConfigured) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const generatedTips = await aiService.generateTips(batch.id);
      setTips(generatedTips);
    } catch (error) {
      console.error('Failed to generate tips:', error);
      setError('Failed to generate brewing tips. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, []);

  useEffect(() => {
    if (isConfigured === true) {
      generateTips();
    }
  }, [batch.id, isConfigured]);

  if (isConfigured === null) {
    return (
      <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="animate-spin" size={16} />
          <span className="text-sm">Checking AI service...</span>
        </div>
      </div>
    );
  }

  if (isConfigured === false) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
          <div>
            <h3 className="font-medium text-yellow-800 mb-1">AI Assistant Not Configured</h3>
            <p className="text-sm text-yellow-700">
              To get AI-powered brewing tips, add your OpenAI API key in Settings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-brewing-amber/10 to-brewing-copper/10 border border-brewing-amber/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bot className="text-brewing-amber" size={20} />
          <h3 className="font-semibold text-gray-800">AI Brewing Tips</h3>
        </div>
        <button
          onClick={generateTips}
          disabled={isLoading}
          className="flex items-center gap-1 text-brewing-amber hover:text-brewing-copper transition-colors disabled:opacity-50"
          title="Refresh tips"
        >
          <RefreshCw className={`${isLoading ? 'animate-spin' : ''}`} size={16} />
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader className="animate-spin" size={16} />
          <span className="text-sm">Generating personalized tips...</span>
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 text-red-600">
          <AlertCircle className="flex-shrink-0" size={16} />
          <span className="text-sm">{error}</span>
        </div>
      ) : tips ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="text-brewing-amber" size={16} />
            <span className="text-sm font-medium text-gray-700">
              Tips for {batch.batchNumber}
            </span>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-line">
            {tips}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          No tips available for this batch.
        </div>
      )}
    </div>
  );
};