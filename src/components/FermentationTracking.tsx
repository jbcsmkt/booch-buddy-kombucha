import React, { useState, useEffect } from 'react';
import { FlaskConical, AlertTriangle, CheckCircle, Brain } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { TASTE_PROFILES, PACKAGING_TYPES } from '../data/constants';
import { isPrimaryFermentComplete, calculateAlcoholEstimate, isUnsafeToBottle, isOverFermented } from '../utils/calculations';

interface FermentationTrackingProps {
  batch: BatchData;
  onUpdate: (updates: Partial<BatchData>) => void;
  apiKey?: string;
  readOnly?: boolean;
}

export const FermentationTracking: React.FC<FermentationTrackingProps> = ({ batch, onUpdate, apiKey, readOnly = false }) => {
  const [localBatch, setLocalBatch] = useState<BatchData>(batch);
  const [aiStatus, setAiStatus] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    // Auto-calculate primary ferment completion
    if (localBatch.endPH && localBatch.endBrix && localBatch.tasteProfile) {
      const isComplete = isPrimaryFermentComplete(localBatch.endPH, localBatch.endBrix, localBatch.tasteProfile);
      setLocalBatch(prev => ({ ...prev, primaryFermentComplete: isComplete }));
      onUpdate({ primaryFermentComplete: isComplete });
    }

    // Calculate alcohol estimate
    if (localBatch.startBrix && localBatch.endBrix) {
      const alcohol = calculateAlcoholEstimate(localBatch.startBrix, localBatch.endBrix);
      setLocalBatch(prev => ({ ...prev, alcoholEstimate: alcohol }));
      onUpdate({ alcoholEstimate: alcohol });
    }
  }, [localBatch.endPH, localBatch.endBrix, localBatch.tasteProfile, localBatch.startBrix]);

  const handleInputChange = (field: keyof BatchData, value: any) => {
    if (readOnly) return;
    const updated = { ...localBatch, [field]: value };
    setLocalBatch(updated);
    onUpdate({ [field]: value });
  };

  const getStatusIcon = () => {
    if (localBatch.finalPH && isUnsafeToBottle(localBatch.finalPH)) {
      return <AlertTriangle className="text-brewing-danger" size={20} />;
    }
    if (localBatch.finalPH && isOverFermented(localBatch.finalPH)) {
      return <AlertTriangle className="text-brewing-warning" size={20} />;
    }
    if (localBatch.primaryFermentComplete) {
      return <CheckCircle className="text-brewing-success" size={20} />;
    }
    return null;
  };

  const handleFermentationAnalysis = async () => {
    if (!apiKey) {
      alert('OpenAI API key is required for AI analysis. Please set it in settings.');
      return;
    }

    if (!localBatch.endPH || !localBatch.endBrix || !localBatch.tasteProfile) {
      alert('Please enter End pH, End Brix, and Taste Profile for analysis.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Calculate days in fermenter
      const startDate = new Date(batch.startDate);
      const currentDate = new Date();
      const daysInFermenter = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Enhanced analysis with method-specific context
      const analysisPrompt = `
You are a fermentation expert aware of one-day, two-day, and zero-day kombucha methods. Consider alcohol risk, residual sweetness, and microbial safety.

Analyze the batch and determine readiness and safety:
- Method: ${batch.method || 'Not specified'}
- Batch ID: ${batch.batchNumber}
- Brew Size: ${batch.brewSize} gal
- Start pH: ${batch.startPH}
- End pH: ${localBatch.endPH}
- Days in Fermenter: ${daysInFermenter}
- Start Brix: ${batch.startBrix}%
- End Brix: ${localBatch.endBrix}%
- Taste: ${localBatch.tasteProfile}
- Tea Type: ${batch.teaType}
- Sugar Type: ${batch.sugarType}

Provide analysis considering the specific method used and determine if the batch is "Ready to bottle" or "Needs more time". Include safety considerations for the chosen method.

Respond with JSON:
{
  "status": "Ready to bottle" or "Needs more time",
  "analysis": "detailed analysis",
  "recommendations": ["rec1", "rec2"],
  "safetyNotes": ["safety note 1", "safety note 2"]
}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a kombucha fermentation expert. Always respond with valid JSON.' },
            { role: 'user', content: analysisPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const analysis = JSON.parse(data.choices[0]?.message?.content || '{}');
      
      setAiStatus(analysis.status || 'Analysis complete');
      onUpdate({ aiStatus: analysis.status || 'Analysis complete' });
    } catch (error) {
      console.error('Fermentation analysis failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`AI Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <FlaskConical className="text-brewing-copper" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Fermentation Tracking</h2>
        {getStatusIcon()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary Fermentation */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Primary Fermentation</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start pH
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.startPH || ''}
                onChange={(e) => handleInputChange('startPH', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                placeholder="4.0-5.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Brix (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.startBrix || ''}
                onChange={(e) => handleInputChange('startBrix', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                placeholder="8-12"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End pH
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.endPH || ''}
                onChange={(e) => handleInputChange('endPH', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                placeholder="2.5-3.5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Brix (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.endBrix || ''}
                onChange={(e) => handleInputChange('endBrix', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                placeholder="0-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taste Profile
            </label>
            <select
              value={localBatch.tasteProfile || ''}
              onChange={(e) => handleInputChange('tasteProfile', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
            >
              <option value="">Select taste profile...</option>
              {TASTE_PROFILES.map(profile => (
                <option key={profile} value={profile}>{profile}</option>
              ))}
            </select>
          </div>

          {/* Status Indicators */}
          {localBatch.primaryFermentComplete !== undefined && (
            <div className={`p-3 rounded-md ${localBatch.primaryFermentComplete ? 'bg-brewing-success bg-opacity-10 border border-brewing-success' : 'bg-brewing-warning bg-opacity-10 border border-brewing-warning'}`}>
              <div className="flex items-center gap-2">
                {localBatch.primaryFermentComplete ? (
                  <CheckCircle size={16} className="text-brewing-success" />
                ) : (
                  <AlertTriangle size={16} className="text-brewing-warning" />
                )}
                <span className="font-semibold text-sm">
                  Primary Ferment {localBatch.primaryFermentComplete ? 'Complete' : 'Not Complete'}
                </span>
              </div>
            </div>
          )}

          {/* AI Analysis Button and Status */}
          <div className="space-y-3">
            <button
              onClick={handleFermentationAnalysis}
              disabled={isAnalyzing || !apiKey || readOnly}
              className="w-full bg-brewing-darkGreen hover:bg-brewing-green text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {isAnalyzing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Brain size={16} />
              )}
              AI Fermentation Analysis
            </button>
            
            {aiStatus && (
              <div className={`px-3 py-2 rounded-md text-center font-medium ${
                aiStatus === 'Ready to bottle' 
                  ? 'bg-brewing-success text-white' 
                  : 'bg-brewing-warning text-white'
              }`}>
                {aiStatus}
              </div>
            )}
          </div>

          {localBatch.alcoholEstimate && (
            <div className="bg-gray-50 p-3 rounded-md">
              <span className="text-sm text-gray-600">Estimated Alcohol Content:</span>
              <div className="font-semibold text-brewing-copper">{localBatch.alcoholEstimate.toFixed(2)}%</div>
            </div>
          )}
        </div>

        {/* Secondary Fermentation & Packaging */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 border-b pb-2">Secondary Fermentation</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secondary Flavoring Added
            </label>
            <input
              type="text"
              value={localBatch.secondaryFlavoringAdded || ''}
              onChange={(e) => handleInputChange('secondaryFlavoringAdded', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              placeholder="e.g., Ginger, Berries, Hops"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flavoring Amount (fl oz)
            </label>
            <input
              type="number"
              step="0.1"
              value={localBatch.flavoringAmount || ''}
              onChange={(e) => handleInputChange('flavoringAmount', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Start Date
              </label>
              <input
                type="date"
                value={localBatch.secondaryStartDate || ''}
                onChange={(e) => handleInputChange('secondaryStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary End Date
              </label>
              <input
                type="date"
                value={localBatch.secondaryEndDate || ''}
                onChange={(e) => handleInputChange('secondaryEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              />
            </div>
          </div>

          {/* Final Measurements */}
          <h4 className="font-medium text-gray-700 mt-6">Final Measurements</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final pH
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.finalPH || ''}
                onChange={(e) => handleInputChange('finalPH', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              />
              {localBatch.finalPH && (
                <div className="mt-1 text-xs">
                  {isUnsafeToBottle(localBatch.finalPH) && (
                    <span className="text-brewing-danger">⚠️ Unsafe to bottle (pH {'>'} 4.0)</span>
                  )}
                  {isOverFermented(localBatch.finalPH) && (
                    <span className="text-brewing-warning">⚠️ Over-fermented (pH {'<'} 2.4)</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Final Brix (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.finalBrix || ''}
                onChange={(e) => handleInputChange('finalBrix', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Final Taste Notes
            </label>
            <textarea
              value={localBatch.finalTasteNotes || ''}
              onChange={(e) => handleInputChange('finalTasteNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
              rows={2}
              placeholder="Describe the final taste profile..."
            />
          </div>

          {/* Packaging Section */}
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium text-gray-700 mb-3">Packaging</h4>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packaging Date
                </label>
                <input
                  type="date"
                  value={localBatch.packagingDate || ''}
                  onChange={(e) => handleInputChange('packagingDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Packaging Type
                </label>
                <select
                  value={localBatch.packagingType || ''}
                  onChange={(e) => handleInputChange('packagingType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                >
                  <option value="">Select type...</option>
                  {PACKAGING_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localBatch.pasteurized || false}
                    onChange={(e) => handleInputChange('pasteurized', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">Pasteurized</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localBatch.qaTestingPerformed || false}
                    onChange={(e) => handleInputChange('qaTestingPerformed', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">QA Testing</span>
                </label>
              </div>
            </div>

            {localBatch.qaTestingPerformed && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  QA Notes
                </label>
                <textarea
                  value={localBatch.qaNotes || ''}
                  onChange={(e) => handleInputChange('qaNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-copper focus:border-transparent"
                  rows={2}
                  placeholder="Quality assurance testing notes..."
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};