import React, { useState } from 'react';
import { X, Save, TestTube, Thermometer, Droplets, FileText, Brain, ChevronDown } from 'lucide-react';
import { BatchData } from '../types/brewing';

// Sensory profile constants for kombucha
const TASTE_OPTIONS = [
  'Sweet', 'Tart', 'Sour', 'Balanced', 'Acidic', 'Fruity', 'Yeasty', 'Vinegary', 
  'Dry', 'Complex', 'Mild', 'Strong', 'Refreshing', 'Flat', 'Over-fermented'
];

const VISUAL_OPTIONS = [
  'Clear', 'Cloudy', 'Hazy', 'Amber', 'Golden', 'Dark', 'Light', 'Carbonated', 
  'Still', 'Foamy', 'Sediment present', 'SCOBY forming', 'Transparent', 'Opaque'
];

const AROMA_OPTIONS = [
  'Fruity', 'Yeasty', 'Vinegar-like', 'Sweet', 'Sour', 'Floral', 'Earthy', 
  'Alcoholic', 'Fresh', 'Musty', 'Tea-like', 'Fermented', 'Clean', 'Off-putting'
];

interface IncrementalDataEntryProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchData | null;
  onSave: (data: IncrementalData) => void;
}

export interface IncrementalData {
  recorded_at: string;
  ph_level?: number;
  brix_level?: number;
  temperature?: number;
  taste_notes?: string | string[];
  visual_notes?: string | string[];
  aroma_notes?: string | string[];
}

export const IncrementalDataEntry: React.FC<IncrementalDataEntryProps> = ({ 
  isOpen, 
  onClose, 
  batch, 
  onSave 
}) => {
  const [data, setData] = useState<IncrementalData>({
    recorded_at: new Date().toISOString().split('T')[0],
    ph_level: undefined,
    brix_level: undefined,
    temperature: undefined,
    taste_notes: [],
    visual_notes: [],
    aroma_notes: []
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!isOpen || !batch) return null;

  const handleSave = async () => {
    setIsAnalyzing(true);
    try {
      await onSave(data);
      // Reset form
      setData({
        recorded_at: new Date().toISOString().split('T')[0],
        ph_level: undefined,
        brix_level: undefined,
        temperature: undefined,
        taste_notes: [],
        visual_notes: [],
        aroma_notes: []
      });
      onClose();
    } catch (error) {
      console.error('Failed to save incremental data:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleInputChange = (field: keyof IncrementalData, value: string | number) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field: 'taste_notes' | 'visual_notes' | 'aroma_notes', value: string) => {
    setData(prev => {
      const currentValues = (prev[field] as string[]) || [];
      const isSelected = currentValues.includes(value);
      
      const newValues = isSelected
        ? currentValues.filter(item => item !== value)
        : [...currentValues, value];
        
      return {
        ...prev,
        [field]: newValues
      };
    });
  };

  const isOptionSelected = (field: 'taste_notes' | 'visual_notes' | 'aroma_notes', value: string) => {
    const currentValues = (data[field] as string[]) || [];
    return currentValues.includes(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <TestTube className="text-brewing-amber" size={24} />
            <h2 className="text-xl font-bold text-gray-800">
              Add Progress Data - Batch {batch.batchNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Recording Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recording Date
            </label>
            <input
              type="date"
              value={data.recorded_at}
              onChange={(e) => handleInputChange('recorded_at', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            />
          </div>

          {/* Measurements */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <TestTube size={16} className="inline mr-1" />
                pH Level
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="14"
                value={data.ph_level || ''}
                onChange={(e) => handleInputChange('ph_level', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="4.0-5.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Droplets size={16} className="inline mr-1" />
                Brix Level (°Bx)
              </label>
              <input
                type="number"
                step="0.1"
                value={data.brix_level || ''}
                onChange={(e) => handleInputChange('brix_level', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="6-12"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Thermometer size={16} className="inline mr-1" />
                Temperature (°F)
              </label>
              <input
                type="number"
                step="0.1"
                value={data.temperature || ''}
                onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="68-78°F"
              />
            </div>
          </div>

          {/* Sensory Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="inline mr-1" />
                Taste Notes
              </label>
              <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {TASTE_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMultiSelectChange('taste_notes', option)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        isOptionSelected('taste_notes', option)
                          ? 'bg-brewing-amber text-white border-brewing-amber'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {(data.taste_notes as string[])?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Selected: {(data.taste_notes as string[]).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="inline mr-1" />
                Visual Notes
              </label>
              <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {VISUAL_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMultiSelectChange('visual_notes', option)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        isOptionSelected('visual_notes', option)
                          ? 'bg-brewing-success text-white border-brewing-success'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {(data.visual_notes as string[])?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Selected: {(data.visual_notes as string[]).join(', ')}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <FileText size={16} className="inline mr-1" />
                Aroma Notes
              </label>
              <div className="border border-gray-300 rounded-md p-2 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {AROMA_OPTIONS.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleMultiSelectChange('aroma_notes', option)}
                      className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                        isOptionSelected('aroma_notes', option)
                          ? 'bg-brewing-gold text-white border-brewing-gold'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {(data.aroma_notes as string[])?.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Selected: {(data.aroma_notes as string[]).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Analysis Info */}
          <div className="bg-brewing-amber bg-opacity-10 p-4 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="text-brewing-copper" size={20} />
              <h3 className="font-semibold text-brewing-copper">AI Analysis</h3>
            </div>
            <p className="text-sm text-gray-700">
              After saving this data entry, our AI will analyze the measurements and notes to provide 
              insights about fermentation progress, potential issues, and recommendations for your batch.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isAnalyzing}
            className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Brain className="animate-pulse" size={16} />
                AI Analyzing...
              </>
            ) : (
              <>
                <Save size={16} />
                Save & Analyze
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};