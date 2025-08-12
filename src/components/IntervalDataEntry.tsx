import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Brain, AlertTriangle, CheckCircle, Loader, Eye, MessageSquare } from 'lucide-react';
import { BatchData, BatchInterval } from '../types/brewing';
import { batchIntervalService } from '../services/database';
import { analyzeFementation } from '../services/aiAnalysis';
import { format } from 'date-fns';
import { sanitizeInput } from '../config/security';

interface IntervalDataEntryProps {
  batch: BatchData;
  apiKey?: string;
  readOnly?: boolean;
}

export const IntervalDataEntry: React.FC<IntervalDataEntryProps> = ({ batch, apiKey, readOnly = false }) => {
  const [intervals, setIntervals] = useState<BatchInterval[]>([]);
  const [isAddingInterval, setIsAddingInterval] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [viewingInterval, setViewingInterval] = useState<BatchInterval | null>(null);
  const [newInterval, setNewInterval] = useState({
    recorded_at: new Date().toISOString().split('T')[0],
    ph_level: '',
    brix_level: '',
    temperature: '',
    taste_notes: '',
    visual_notes: '',
    aroma_notes: ''
  });

  useEffect(() => {
    loadIntervals();
    // Load any existing AI analysis from the latest interval
    loadExistingAnalysis();
  }, [batch.id]);

  const loadExistingAnalysis = async () => {
    try {
      const data = await batchIntervalService.getByBatchId(batch.id);
      if (data.length > 0) {
        // Find the most recent interval with AI analysis
        const intervalWithAnalysis = data
          .filter(interval => interval.ai_analysis && interval.health_score)
          .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0];
        
        if (intervalWithAnalysis) {
          setAiAnalysis({
            healthScore: intervalWithAnalysis.health_score!,
            analysis: intervalWithAnalysis.ai_analysis!,
            recommendations: intervalWithAnalysis.recommendations || [],
            alerts: [] // We don't store alerts separately, they're part of recommendations
          });
        }
      }
    } catch (error) {
      console.error('Failed to load existing analysis:', error);
    }
  };

  const loadIntervals = async () => {
    try {
      const data = await batchIntervalService.getByBatchId(batch.id);
      setIntervals(data);
    } catch (error) {
      console.error('Failed to load intervals:', error);
    }
  };

  const handleAddInterval = async () => {
    try {
      const intervalData = {
        batch_id: batch.id,
        recorded_at: newInterval.recorded_at,
        ph_level: newInterval.ph_level ? parseFloat(newInterval.ph_level) : undefined,
        brix_level: newInterval.brix_level ? parseFloat(newInterval.brix_level) : undefined,
        temperature: newInterval.temperature ? parseFloat(newInterval.temperature) : undefined,
        taste_notes: newInterval.taste_notes ? sanitizeInput(newInterval.taste_notes) : undefined,
        visual_notes: newInterval.visual_notes ? sanitizeInput(newInterval.visual_notes) : undefined,
        aroma_notes: newInterval.aroma_notes ? sanitizeInput(newInterval.aroma_notes) : undefined
      };

      await batchIntervalService.create(intervalData);
      await loadIntervals();
      setIsAddingInterval(false);
      setNewInterval({
        recorded_at: new Date().toISOString().split('T')[0],
        ph_level: '',
        brix_level: '',
        temperature: '',
        taste_notes: '',
        visual_notes: '',
        aroma_notes: ''
      });
    } catch (error) {
      console.error('Failed to add interval:', error);
      alert('Failed to save interval data');
    }
  };

  const handleAIAnalysis = async () => {
    if (!apiKey) {
      alert('OpenAI API key is required for AI analysis. Please set it in settings.');
      return;
    }

    if (intervals.length === 0) {
      alert('No interval data available for analysis');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFementation({
        intervals,
        batchInfo: {
          teaType: batch.teaType,
          sugarType: batch.sugarType,
          startDate: batch.startDate,
          brewSize: batch.brewSize,
          method: batch.method
        }
      }, apiKey);

      setAiAnalysis(analysis);

      // Save the AI analysis to the most recent interval
      if (intervals.length > 0) {
        const latestInterval = intervals[intervals.length - 1];
        try {
          await batchIntervalService.update(latestInterval.id, {
            ai_analysis: analysis.analysis,
            health_score: analysis.healthScore,
            recommendations: analysis.recommendations
          });
          
          // Reload intervals to show the updated data
          await loadIntervals();
        } catch (error) {
          console.error('Failed to save AI analysis to database:', error);
          // Don't show an error to user since the analysis still worked
        }
      }
    } catch (error) {
      console.error('AI Analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`AI Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-brewing-success';
    if (score >= 60) return 'text-brewing-warning';
    return 'text-brewing-danger';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-brewing-copper" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Interval Data Tracking</h2>
        </div>
        <div className="flex gap-3">
          {!readOnly && (
            <button
              onClick={() => setIsAddingInterval(true)}
              className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus size={16} />
              Add Data Point
            </button>
          )}
          {intervals.length > 0 && (
            <button
              onClick={handleAIAnalysis}
              disabled={isAnalyzing || !apiKey || readOnly}
              className="bg-brewing-darkGreen hover:bg-brewing-green text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? <Loader size={16} className="animate-spin" /> : <Brain size={16} />}
              AI Analysis
            </button>
          )}
        </div>
      </div>

      {/* Add Interval Form */}
      {isAddingInterval && !readOnly && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Data Point</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={newInterval.recorded_at}
                onChange={(e) => setNewInterval(prev => ({ ...prev, recorded_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
              <input
                type="number"
                step="0.1"
                value={newInterval.ph_level}
                onChange={(e) => setNewInterval(prev => ({ ...prev, ph_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="2.5-4.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brix Level</label>
              <input
                type="number"
                step="0.1"
                value={newInterval.brix_level}
                onChange={(e) => setNewInterval(prev => ({ ...prev, brix_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="0-12"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°F)</label>
              <input
                type="number"
                value={newInterval.temperature}
                onChange={(e) => setNewInterval(prev => ({ ...prev, temperature: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="68-78"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taste Notes</label>
              <input
                type="text"
                value={newInterval.taste_notes}
                onChange={(e) => setNewInterval(prev => ({ ...prev, taste_notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Sweet, tart, etc."
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visual Notes</label>
              <input
                type="text"
                value={newInterval.visual_notes}
                onChange={(e) => setNewInterval(prev => ({ ...prev, visual_notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Color, clarity, etc."
                maxLength={200}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aroma Notes</label>
              <input
                type="text"
                value={newInterval.aroma_notes}
                onChange={(e) => setNewInterval(prev => ({ ...prev, aroma_notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Fruity, vinegary, etc."
                maxLength={200}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddInterval}
              className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save Data Point
            </button>
            <button
              onClick={() => setIsAddingInterval(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* AI Analysis Results */}
      {aiAnalysis && (
        <div className="bg-blue-50 rounded-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="text-blue-600" size={20} />
            <h3 className="font-semibold text-blue-800">AI Fermentation Analysis</h3>
            <div className={`ml-auto text-2xl font-bold ${getHealthScoreColor(aiAnalysis.healthScore)}`}>
              {aiAnalysis.healthScore}/100
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Analysis</h4>
              <p className="text-blue-700 text-sm">{aiAnalysis.analysis}</p>
            </div>
            
            {aiAnalysis.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Recommendations</h4>
                <ul className="text-blue-700 text-sm space-y-1">
                  {aiAnalysis.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-brewing-success mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {aiAnalysis.alerts.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">Alerts</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {aiAnalysis.alerts.map((alert: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertTriangle size={14} className="text-brewing-danger mt-0.5 flex-shrink-0" />
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intervals Table */}
      {intervals.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">pH</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brix</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taste</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visual</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aroma</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">AI Score</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {intervals.map((interval) => (
                <tr key={interval.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {format(new Date(interval.recorded_at), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.ph_level?.toFixed(1) || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.brix_level?.toFixed(1) || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.temperature ? `${interval.temperature}°F` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.taste_notes || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.visual_notes || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {interval.aroma_notes || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {interval.health_score ? (
                      <span className={`font-semibold ${getHealthScoreColor(interval.health_score)}`}>
                        {interval.health_score}/100
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {interval.ai_analysis && (
                      <button
                        onClick={() => setViewingInterval(interval)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="View AI analysis"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Points Yet</h3>
          <p className="text-gray-500">Start tracking your fermentation progress by adding data points.</p>
        </div>
      )}

      {/* AI Analysis Modal */}
      {viewingInterval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-2">
                <MessageSquare className="text-blue-600" size={20} />
                <h3 className="text-lg font-semibold text-gray-800">
                  AI Analysis - {format(new Date(viewingInterval.recorded_at), 'MMM dd, yyyy')}
                </h3>
              </div>
              <button
                onClick={() => setViewingInterval(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Health Score */}
              {viewingInterval.health_score && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <span className="font-medium text-gray-700">Health Score:</span>
                  <span className={`text-2xl font-bold ${getHealthScoreColor(viewingInterval.health_score)}`}>
                    {viewingInterval.health_score}/100
                  </span>
                </div>
              )}
              
              {/* AI Analysis */}
              {viewingInterval.ai_analysis && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Analysis</h4>
                  <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-md">
                    {viewingInterval.ai_analysis}
                  </p>
                </div>
              )}
              
              {/* Recommendations */}
              {viewingInterval.recommendations && viewingInterval.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Recommendations</h4>
                  <ul className="text-gray-700 text-sm space-y-1">
                    {viewingInterval.recommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 bg-green-50 p-2 rounded">
                        <CheckCircle size={14} className="text-brewing-success mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Data Point Details */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-800 mb-2">Data Point Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">pH Level:</span>
                    <div className="font-medium">{viewingInterval.ph_level?.toFixed(1) || 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Brix Level:</span>
                    <div className="font-medium">{viewingInterval.brix_level?.toFixed(1) || 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Temperature:</span>
                    <div className="font-medium">{viewingInterval.temperature ? `${viewingInterval.temperature}°F` : 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Taste Notes:</span>
                    <div className="font-medium">{viewingInterval.taste_notes || 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Visual Notes:</span>
                    <div className="font-medium">{viewingInterval.visual_notes || 'Not recorded'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Aroma Notes:</span>
                    <div className="font-medium">{viewingInterval.aroma_notes || 'Not recorded'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t">
              <button
                onClick={() => setViewingInterval(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};