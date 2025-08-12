import React, { useState, useEffect } from 'react';
import { Calendar, Calculator, Beaker, Thermometer, Clock } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { calculateBrewRatios } from '../utils/calculations';
import { TEA_TYPES, SUGAR_TYPES, TEA_GUIDANCE, BREWING_METHODS } from '../data/constants';

interface BrewEntryFormProps {
  batch: BatchData;
  onUpdate: (updates: Partial<BatchData>) => void;
  readOnly?: boolean;
}

export const BrewEntryForm: React.FC<BrewEntryFormProps> = ({ batch, onUpdate, readOnly = false }) => {
  const [localBatch, setLocalBatch] = useState<BatchData>(batch);

  useEffect(() => {
    if (localBatch.brewSize > 0) {
      const ratios = calculateBrewRatios(localBatch.brewSize);
      const updates = {
        ...ratios,
        starterTea: localBatch.starterTea || ratios.starterVolume,
        sugarUsed: localBatch.sugarUsed || ratios.sugarAmount
      };
      setLocalBatch(prev => ({ ...prev, ...updates }));
      // Don't trigger auto-save for ratio calculations, only update local state
    }
  }, [localBatch.brewSize]);

  const handleInputChange = (field: keyof BatchData, value: any) => {
    if (readOnly) return;
    const updated = { ...localBatch, [field]: value };
    setLocalBatch(updated);
    onUpdate({ [field]: value });
  };

  const currentTeaGuidance = TEA_GUIDANCE.find(guide => guide.type === localBatch.teaType);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Beaker className="text-brewing-amber" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Brew Entry</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Batch Number
            </label>
            <input
              type="text"
              value={localBatch.batchNumber}
              readOnly={true}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar size={16} className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={localBatch.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md ${readOnly ? 'bg-gray-50 text-gray-500' : 'focus:ring-2 focus:ring-brewing-amber focus:border-transparent'}`}
              readOnly={readOnly}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calculator size={16} className="inline mr-1" />
              Brew Size (gallons)
            </label>
            <input
              type="number"
              step="0.1"
              value={localBatch.brewSize || ''}
              onChange={(e) => handleInputChange('brewSize', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tea Type
            </label>
            <select
              value={localBatch.teaType}
              onChange={(e) => handleInputChange('teaType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="">Select tea type...</option>
              {TEA_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {localBatch.teaType === 'Custom Blend' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tea Blend Notes
              </label>
              <textarea
                value={localBatch.teaBlendNotes || ''}
                onChange={(e) => handleInputChange('teaBlendNotes', e.target.value)}
                placeholder="e.g., 50% Black, 50% Green"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                rows={2}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tea Steeping Temp (°F)
            </label>
            <input
              type="number"
              value={localBatch.teaSteepingTemp || ''}
              onChange={(e) => handleInputChange('teaSteepingTemp', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              placeholder="160-212°F"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock size={16} className="inline mr-1" />
              Tea Steeping Time (min)
            </label>
            <input
              type="number"
              step="0.5"
              value={localBatch.teaSteepingTime || ''}
              onChange={(e) => handleInputChange('teaSteepingTime', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              placeholder="2-7 min"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tea Amount (grams)
            </label>
            <input
              type="number"
              step="0.1"
              value={localBatch.teaAmountGrams || ''}
              onChange={(e) => handleInputChange('teaAmountGrams', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              placeholder="e.g., 15-30g"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Starter Tea (fl oz)
            </label>
            <input
              type="number"
              step="0.1"
              value={localBatch.starterTea || ''}
              onChange={(e) => handleInputChange('starterTea', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              placeholder="Auto-calculated or manual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sugar Used (cups)
            </label>
            <input
              type="number"
              step="0.1"
              value={localBatch.sugarUsed || ''}
              onChange={(e) => handleInputChange('sugarUsed', parseFloat(e.target.value) || undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              placeholder="Auto-calculated or manual"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sugar Type
            </label>
            <select
              value={localBatch.sugarType}
              onChange={(e) => handleInputChange('sugarType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="">Select sugar type...</option>
              {SUGAR_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Method
            </label>
            <select
              value={localBatch.method || ''}
              onChange={(e) => handleInputChange('method', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="">Select method...</option>
              {BREWING_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-calculated Values & Measurements */}
        <div className="space-y-4">
          {/* Auto-calculated ratios */}
          {localBatch.brewSize > 0 && (
            <div className="bg-brewing-amber bg-opacity-10 p-4 rounded-md">
              <h3 className="font-semibold text-brewing-copper mb-3">Auto-Calculated Ratios</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Starter Volume:</span>
                  <div className="font-semibold">{localBatch.starterTea || localBatch.starterVolume} fl oz</div>
                </div>
                <div>
                  <span className="text-gray-600">Tea Weight:</span>
                  <div className="font-semibold">
                    {localBatch.teaAmountGrams ? `${localBatch.teaAmountGrams}g` : `${localBatch.teaWeight} oz`}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Water Volume:</span>
                  <div className="font-semibold">{localBatch.waterVolume} gal</div>
                </div>
                <div>
                  <span className="text-gray-600">Sugar Amount:</span>
                  <div className="font-semibold">{localBatch.sugarUsed || localBatch.sugarAmount} cups</div>
                </div>
              </div>
            </div>
          )}

          {/* Tea Guidance */}
          {currentTeaGuidance && (
            <div className="bg-brewing-green bg-opacity-10 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={16} className="text-brewing-darkGreen" />
                <h3 className="font-semibold text-brewing-darkGreen">Steeping Guidance</h3>
              </div>
              <div className="text-sm space-y-1">
                <div><span className="text-gray-600">Temperature:</span> <span className="font-semibold">{currentTeaGuidance.tempRange}</span></div>
                <div><span className="text-gray-600">Time:</span> <span className="font-semibold">{currentTeaGuidance.timeRange}</span></div>
              </div>
            </div>
          )}

          {/* Initial Measurements */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Initial Measurements</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start pH
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.startPH || ''}
                onChange={(e) => handleInputChange('startPH', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="4.0-5.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Brix (°Bx)
              </label>
              <input
                type="number"
                step="0.1"
                value={localBatch.startBrix || ''}
                onChange={(e) => handleInputChange('startBrix', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="8-12"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};