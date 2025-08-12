import React, { useState, useEffect } from 'react';
import { Zap, Thermometer, Clock, Info } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { CARBONATION_STATUSES } from '../data/constants';
import { calculateForceCardPSI, calculateCarbTimeEstimate } from '../utils/calculations';

interface CarbonationModuleProps {
  batch: BatchData;
  onUpdate: (updates: Partial<BatchData>) => void;
  readOnly?: boolean;
}

export const CarbonationModule: React.FC<CarbonationModuleProps> = ({ batch, onUpdate, readOnly = false }) => {
  const [localBatch, setLocalBatch] = useState<BatchData>(batch);

  useEffect(() => {
    // Auto-calculate PSI when temp and CO2 volume change
    if (localBatch.carbonationTemp && localBatch.targetCO2Volume) {
      const psi = calculateForceCardPSI(localBatch.carbonationTemp, localBatch.targetCO2Volume);
      const timeEstimate = calculateCarbTimeEstimate(psi);
      
      setLocalBatch(prev => ({ 
        ...prev, 
        forceCardPSI: psi,
        carbTimeEstimate: timeEstimate
      }));
      onUpdate({ 
        forceCardPSI: psi,
        carbTimeEstimate: timeEstimate
      });
    }
  }, [localBatch.carbonationTemp, localBatch.targetCO2Volume]);

  const handleInputChange = (field: keyof BatchData, value: any) => {
    if (readOnly) return;
    const updatedBatch = { ...localBatch, [field]: value };
    setLocalBatch(updatedBatch);
    onUpdate({ [field]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="text-brewing-gold" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Forced Carbonation</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Carbonation Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">Carbonation Settings</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Thermometer size={16} className="inline mr-1" />
              Carbonation Temperature (°F)
            </label>
            <input
              type="number"
              value={localBatch.carbonationTemp || ''}
              onChange={(e) => handleInputChange('carbonationTemp', parseFloat(e.target.value) || undefined)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-brewing-gold focus:border-transparent'}`}
              placeholder="34-40°F recommended"
              readOnly={readOnly}
            />
            <div className="text-xs text-gray-500 mt-1">Optimal range: 34-40°F</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target CO₂ Volume
            </label>
            <input
              type="number"
              step="0.1"
              min="2.2"
              max="3.0"
              value={localBatch.targetCO2Volume || ''}
              onChange={(e) => handleInputChange('targetCO2Volume', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
              placeholder="2.2-3.0"
            />
            <div className="text-xs text-gray-500 mt-1">Standard range: 2.2-3.0 volumes</div>
          </div>

          {/* Auto-calculated PSI */}
          {localBatch.forceCardPSI && (
            <div className="bg-brewing-gold bg-opacity-10 p-4 rounded-md">
              <h4 className="font-semibold text-brewing-copper mb-2">Auto-Calculated Settings</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Force Carb PSI:</span>
                  <div className="text-lg font-bold text-brewing-copper">{localBatch.forceCardPSI} PSI</div>
                </div>
                {localBatch.carbTimeEstimate && (
                  <div>
                    <span className="text-sm text-gray-600">Estimated Time:</span>
                    <div className="text-lg font-bold text-brewing-copper">{localBatch.carbTimeEstimate} hours</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carbonation Status
            </label>
            <select
              value={localBatch.carbonationStatus || ''}
              onChange={(e) => handleInputChange('carbonationStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
            >
              <option value="">Select status...</option>
              {CARBONATION_STATUSES.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={localBatch.pressurizationStarted || false}
                onChange={(e) => handleInputChange('pressurizationStarted', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm">Pressurization Started</span>
            </label>
          </div>
        </div>

        {/* Instructions & Recommendations */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800 mb-4">Instructions & Recommendations</h3>

          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex items-start gap-2">
              <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Carbonation Process</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Chill kombucha to 34-40°F</li>
                  <li>Apply calculated PSI pressure</li>
                  <li>Wait 24-48 hours for carbonation</li>
                  <li>Serve at 10-12 PSI</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-brewing-green bg-opacity-10 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={16} className="text-brewing-darkGreen" />
              <h4 className="font-semibold text-brewing-darkGreen">Serving Recommendations</h4>
            </div>
            <div className="text-sm text-brewing-darkGreen space-y-1">
              <div><strong>Serving Pressure:</strong> 10-12 PSI</div>
              <div><strong>Serving Temperature:</strong> 38-42°F</div>
              <div><strong>Glass Type:</strong> Wide-mouth for aroma</div>
            </div>
          </div>

          {/* Progress Indicator */}
          {localBatch.carbonationStatus && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Carbonation Progress</span>
                <span className="text-sm text-gray-500">
                  {localBatch.carbonationStatus}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    localBatch.carbonationStatus === 'Not Started' ? 'bg-gray-400 w-0' :
                    localBatch.carbonationStatus === 'In Progress' ? 'bg-brewing-warning w-1/2' :
                    'bg-brewing-success w-full'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Time Tracker */}
          {localBatch.pressurizationStarted && localBatch.carbTimeEstimate && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-gray-600" />
                <h4 className="font-semibold text-gray-800">Time Tracking</h4>
              </div>
              <div className="text-sm text-gray-600">
                <div>Estimated completion: {localBatch.carbTimeEstimate} hours</div>
                <div className="text-xs mt-1 text-gray-500">
                  Monitor pressure and taste-test after 24 hours
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};