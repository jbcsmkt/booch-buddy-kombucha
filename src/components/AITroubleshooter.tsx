import React, { useState } from 'react';
import { Bot, AlertTriangle, Send, Loader } from 'lucide-react';
import { aiService } from '../services/aiService';
import type { Batch } from '../types/brewing';

interface AITroubleshooterProps {
  batch: Batch;
  onClose?: () => void;
}

export const AITroubleshooter: React.FC<AITroubleshooterProps> = ({ batch, onClose }) => {
  const [issue, setIssue] = useState('');
  const [advice, setAdvice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const commonIssues = [
    'Fermentation is too slow',
    'Kombucha is too sour/acidic',
    'Kombucha is still too sweet',
    'Strange smell or taste',
    'SCOBY looks unhealthy',
    'Possible mold contamination',
    'pH levels seem wrong',
    'Temperature control issues'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const troubleshootAdvice = await aiService.troubleshootBatch(batch.id, issue);
      setAdvice(troubleshootAdvice);
    } catch (error) {
      console.error('Troubleshooting error:', error);
      setError('Failed to get troubleshooting advice. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-5/6 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bot className="text-brewing-amber" size={24} />
            <h2 className="text-xl font-semibold text-gray-800">
              AI Troubleshooter
            </h2>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
            >
              ×
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Batch Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="font-medium text-gray-700 mb-2">Batch Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Batch: {batch.batchNumber}</div>
              <div>Tea Type: {batch.teaType}</div>
              <div>Status: {batch.status}</div>
              <div>Start Date: {new Date(batch.startDate).toLocaleDateString()}</div>
              {batch.startPH && <div>Starting pH: {batch.startPH}</div>}
              {batch.startBrix && <div>Starting Brix: {batch.startBrix}</div>}
            </div>
          </div>

          {/* Issue Input */}
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Describe the issue:</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="Describe what's wrong with your batch or what you're concerned about..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brewing-amber focus:border-transparent resize-none"
                disabled={isLoading}
              />
              
              {/* Common Issues */}
              <div>
                <p className="text-sm text-gray-600 mb-2">Or select a common issue:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {commonIssues.map((commonIssue, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setIssue(commonIssue)}
                      className="text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      disabled={isLoading}
                    >
                      {commonIssue}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!issue.trim() || isLoading}
                className="w-full bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" size={16} />
                    Getting advice...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Get AI Advice
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={16} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Advice Display */}
          {advice && (
            <div className="bg-brewing-amber/10 border border-brewing-amber/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Bot className="text-brewing-amber flex-shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-2">AI Troubleshooting Advice</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {advice}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {onClose && (
          <div className="p-4 border-t">
            <button
              onClick={onClose}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};