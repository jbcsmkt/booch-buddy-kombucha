import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Brain, TestTube, Thermometer, Droplets, Eye, Nose, Coffee, Clock, ArrowRight, ChevronDown, ChevronUp, Edit3, Trash2 } from 'lucide-react';
import { BatchData, BatchInterval, AIAnalysis } from '../types/brewing';
import { aiAnalysisService } from '../services/aiAnalysisService';

interface ProgressHistoryProps {
  batches?: BatchData[];
  selectedBatchId?: string | number;
  showAllBatches?: boolean;
}

interface IntervalWithAnalysis extends BatchInterval {
  aiAnalysis?: AIAnalysis;
}

export const ProgressHistory: React.FC<ProgressHistoryProps> = ({ 
  batches = [], 
  selectedBatchId,
  showAllBatches = true 
}) => {
  const [intervals, setIntervals] = useState<IntervalWithAnalysis[]>([]);
  const [analyses, setAnalyses] = useState<AIAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | number | 'all'>(selectedBatchId || 'all');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [editingInterval, setEditingInterval] = useState<IntervalWithAnalysis | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadProgressData();
  }, [selectedBatch]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      if (selectedBatch === 'all') {
        // Load all intervals and analyses
        const [intervalsResponse, analysesResponse] = await Promise.all([
          fetch('http://localhost:5000/api/intervals', { credentials: 'include' }),
          fetch('http://localhost:5000/api/ai/analyses', { credentials: 'include' })
        ]);

        if (intervalsResponse.ok && analysesResponse.ok) {
          const intervalsData = await intervalsResponse.json();
          const analysesData = await analysesResponse.json();
          
          // Match intervals with their AI analyses
          const intervalsWithAnalysis = intervalsData.map((interval: BatchInterval) => {
            // Find the AI analysis for this interval - match by batch and closest timestamp
            const matchingAnalysis = analysesData.find((analysis: AIAnalysis) => 
              analysis.batch_id === interval.batch_id && 
              Math.abs(new Date(analysis.analyzed_at).getTime() - new Date(interval.created_at || interval.recorded_at).getTime()) < 60000 // within 1 minute
            ) || analysesData.find((analysis: AIAnalysis) => 
              analysis.batch_id === interval.batch_id // fallback to just batch match if timestamp matching fails
            );
            
            console.log('Progress History - Matching interval:', interval.id, 'with analysis:', matchingAnalysis?.id);
            return { ...interval, aiAnalysis: matchingAnalysis };
          });

          setIntervals(intervalsWithAnalysis);
          setAnalyses(analysesData);
        }
      } else {
        // Load data for specific batch
        const [intervalsResponse, analysesData] = await Promise.all([
          fetch(`http://localhost:5000/api/intervals/batch/${selectedBatch}`, { credentials: 'include' }),
          aiAnalysisService.getAnalysesForBatch(selectedBatch)
        ]);

        if (intervalsResponse.ok) {
          const intervalsData = await intervalsResponse.json();
          
          const intervalsWithAnalysis = intervalsData.map((interval: BatchInterval) => {
            // Find the AI analysis for this interval - match by closest timestamp
            const matchingAnalysis = analysesData.find((analysis: AIAnalysis) => 
              Math.abs(new Date(analysis.analyzed_at).getTime() - new Date(interval.created_at || interval.recorded_at).getTime()) < 60000 // within 1 minute
            ) || analysesData.find((analysis: AIAnalysis) => 
              analysis.batch_id === interval.batch_id // fallback to batch match
            );
            return { ...interval, aiAnalysis: matchingAnalysis };
          });

          setIntervals(intervalsWithAnalysis);
          setAnalyses(analysesData);
        }
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  const getBatchName = (batchId: string) => {
    const batch = batches.find(b => b.id.toString() === batchId);
    return batch?.batchNumber || `Batch ${batchId}`;
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const formatNotes = (notes: string | string[] | undefined) => {
    if (!notes) return 'None';
    if (Array.isArray(notes)) {
      return notes.length > 0 ? notes.join(', ') : 'None';
    }
    return notes;
  };

  const handleEditInterval = (interval: IntervalWithAnalysis) => {
    setEditingInterval(interval);
  };

  const handleSaveEdit = async (updatedInterval: Partial<BatchInterval>) => {
    if (!editingInterval) return;

    try {
      const response = await fetch(`http://localhost:5000/api/intervals/${editingInterval.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(updatedInterval)
      });

      if (response.ok) {
        const savedInterval = await response.json();
        // Update the interval in the state
        setIntervals(prev => prev.map(interval => 
          interval.id === editingInterval.id 
            ? { ...interval, ...savedInterval }
            : interval
        ));
        setEditingInterval(null);
        console.log('Progress entry updated successfully');
      } else {
        throw new Error('Failed to update progress entry');
      }
    } catch (error) {
      console.error('Error updating progress entry:', error);
      alert('Failed to update progress entry. Please try again.');
    }
  };

  const handleDeleteInterval = async (intervalId: string) => {
    if (!confirm('Are you sure you want to delete this progress entry?')) {
      return;
    }

    setIsDeleting(intervalId);
    try {
      const response = await fetch(`http://localhost:5000/api/intervals/${intervalId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Remove the interval from the state
        setIntervals(prev => prev.filter(interval => interval.id !== intervalId));
        console.log('Progress entry deleted successfully');
      } else {
        throw new Error('Failed to delete progress entry');
      }
    } catch (error) {
      console.error('Error deleting progress entry:', error);
      alert('Failed to delete progress entry. Please try again.');
    } finally {
      setIsDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brewing-amber"></div>
        <span className="ml-3 text-gray-600">Loading progress history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="text-brewing-amber" size={28} />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Progress History</h2>
              <p className="text-gray-600">Track fermentation progress with AI insights</p>
            </div>
          </div>

          {showAllBatches && batches.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by batch:</label>
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              >
                <option value="all">All Batches</option>
                {batches.map(batch => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-brewing-amber bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TestTube className="text-brewing-copper" size={20} />
              <span className="font-semibold text-brewing-copper">Total Entries</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{intervals.length}</p>
          </div>
          
          <div className="bg-brewing-success bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="text-brewing-darkGreen" size={20} />
              <span className="font-semibold text-brewing-darkGreen">AI Analyses</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{analyses.length}</p>
          </div>
          
          <div className="bg-brewing-gold bg-opacity-10 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="text-brewing-copper" size={20} />
              <span className="font-semibold text-brewing-copper">Avg Health Score</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">
              {analyses.length > 0 
                ? Math.round(analyses.reduce((sum, a) => sum + a.health_score, 0) / analyses.length)
                : 'N/A'
              }
            </p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <span className="font-semibold text-blue-600">Date Range</span>
            </div>
            <p className="text-sm font-medium text-gray-800 mt-1">
              {intervals.length > 0 
                ? `${new Date(intervals[intervals.length - 1]?.recorded_at).toLocaleDateString()} - ${new Date(intervals[0]?.recorded_at).toLocaleDateString()}`
                : 'No data'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {intervals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <TestTube className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Progress Data</h3>
            <p className="text-gray-500">
              Start adding incremental data entries to track fermentation progress.
            </p>
          </div>
        ) : (
          intervals
            .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
            .map((interval) => {
              const isExpanded = expandedEntries.has(interval.id);
              const hasAnalysis = !!interval.aiAnalysis;
              
              return (
                <div key={interval.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Entry Header */}
                  <div 
                    className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleEntryExpansion(interval.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="text-gray-500" size={16} />
                          <span className="font-medium text-gray-800">
                            {new Date(interval.recorded_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {showAllBatches && (
                          <div className="flex items-center gap-2">
                            <TestTube className="text-brewing-amber" size={16} />
                            <span className="text-brewing-copper font-medium">
                              {getBatchName(interval.batch_id)}
                            </span>
                          </div>
                        )}
                        
                        {hasAnalysis && (
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getHealthScoreColor(interval.aiAnalysis!.health_score)}`}>
                            Health: {interval.aiAnalysis!.health_score}/100
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Edit and Delete buttons */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditInterval(interval);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded"
                          title="Edit entry"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInterval(interval.id);
                          }}
                          disabled={isDeleting === interval.id}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors rounded disabled:opacity-50"
                          title="Delete entry"
                        >
                          <Trash2 size={16} />
                        </button>
                        {hasAnalysis && (
                          <Brain className="text-brewing-success" size={16} />
                        )}
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Measurements */}
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <TestTube size={16} />
                            Measurements
                          </h4>
                          <div className="space-y-3">
                            {interval.ph_level && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">pH Level:</span>
                                <span className="font-medium">{interval.ph_level}</span>
                              </div>
                            )}
                            {interval.brix_level && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Brix Level:</span>
                                <span className="font-medium">{interval.brix_level}°Bx</span>
                              </div>
                            )}
                            {interval.temperature && (
                              <div className="flex items-center justify-between">
                                <span className="text-gray-600">Temperature:</span>
                                <span className="font-medium">{interval.temperature}°F</span>
                              </div>
                            )}
                          </div>

                          {/* Sensory Notes */}
                          <div className="mt-6">
                            <h5 className="font-medium text-gray-700 mb-2">Sensory Profile</h5>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="text-gray-600">Taste:</span>
                                <span className="ml-2 text-gray-800">{formatNotes(interval.taste_notes)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Visual:</span>
                                <span className="ml-2 text-gray-800">{formatNotes(interval.visual_notes)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Aroma:</span>
                                <span className="ml-2 text-gray-800">{formatNotes(interval.aroma_notes)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* AI Analysis */}
                        {hasAnalysis && (
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <Brain className="text-brewing-success" size={16} />
                              AI Analysis
                            </h4>
                            
                            <div className="space-y-4">
                              {/* Health Score */}
                              <div className={`p-3 rounded-lg ${getHealthScoreColor(interval.aiAnalysis!.health_score)}`}>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">Health Score</span>
                                  <span className="text-lg font-bold">{interval.aiAnalysis!.health_score}/100</span>
                                </div>
                              </div>

                              {/* Insights */}
                              <div>
                                <h5 className="font-medium text-gray-700 mb-2">Insights</h5>
                                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                  {interval.aiAnalysis!.insights}
                                </p>
                              </div>

                              {/* Recommendations */}
                              {interval.aiAnalysis!.recommendations.length > 0 && (
                                <div>
                                  <h5 className="font-medium text-gray-700 mb-2">Recommendations</h5>
                                  <ul className="space-y-1">
                                    {interval.aiAnalysis!.recommendations.map((rec, index) => (
                                      <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                                        <ArrowRight size={12} className="text-brewing-amber mt-1 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              <div className="text-xs text-gray-500 mt-3">
                                Analyzed: {new Date(interval.aiAnalysis!.analyzed_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
        )}
      </div>

      {/* Edit Modal */}
      {editingInterval && (
        <EditIntervalModal
          interval={editingInterval}
          onSave={handleSaveEdit}
          onCancel={() => setEditingInterval(null)}
        />
      )}
    </div>
  );
};

// Edit Modal Component
interface EditIntervalModalProps {
  interval: IntervalWithAnalysis;
  onSave: (updatedInterval: Partial<BatchInterval>) => void;
  onCancel: () => void;
}

const EditIntervalModal: React.FC<EditIntervalModalProps> = ({ interval, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    recorded_at: interval.recorded_at,
    ph_level: interval.ph_level || '',
    brix_level: interval.brix_level || '',
    temperature: interval.temperature || '',
    taste_notes: interval.taste_notes || '',
    visual_notes: interval.visual_notes || '',
    aroma_notes: interval.aroma_notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      ph_level: formData.ph_level ? parseFloat(formData.ph_level as string) : undefined,
      brix_level: formData.brix_level ? parseFloat(formData.brix_level as string) : undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature as string) : undefined
    };
    onSave(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Edit Progress Entry</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.recorded_at}
              onChange={(e) => setFormData(prev => ({ ...prev, recorded_at: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH Level</label>
              <input
                type="number"
                step="0.1"
                value={formData.ph_level}
                onChange={(e) => setFormData(prev => ({ ...prev, ph_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brix Level</label>
              <input
                type="number"
                step="0.1"
                value={formData.brix_level}
                onChange={(e) => setFormData(prev => ({ ...prev, brix_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
              <input
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData(prev => ({ ...prev, temperature: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taste Notes</label>
            <textarea
              value={formData.taste_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, taste_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visual Notes</label>
            <textarea
              value={formData.visual_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, visual_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aroma Notes</label>
            <textarea
              value={formData.aroma_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, aroma_notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-brewing-amber text-white py-2 px-4 rounded-md hover:bg-brewing-copper transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};