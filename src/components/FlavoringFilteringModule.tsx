import React, { useState } from 'react';
import { Droplets, Filter, AlertTriangle, Lightbulb } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { FLAVORING_METHODS, FILTERING_METHODS, CLARITY_LEVELS } from '../data/constants';

interface FlavoringFilteringModuleProps {
  batch: BatchData;
  onUpdate: (updates: Partial<BatchData>) => void;
  apiKey?: string;
  readOnly?: boolean;
}

export const FlavoringFilteringModule: React.FC<FlavoringFilteringModuleProps> = ({ batch, onUpdate, apiKey, readOnly = false }) => {
  const [localBatch, setLocalBatch] = useState<BatchData>(batch);
  const [flavorSuggestions, setFlavorSuggestions] = useState<string[]>([]);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);

  const handleInputChange = (field: keyof BatchData, value: any) => {
    if (readOnly) return;
    const updated = { ...localBatch, [field]: value };
    setLocalBatch(updated);
    onUpdate({ [field]: value });
  };

  // Warning logic
  const showFilteringWarning = () => {
    return localBatch.flavoringMethod === 'Juice' && 
           !localBatch.sterilized && 
           localBatch.filteringMethod === 'None';
  };

  const showClarityWarning = () => {
    return localBatch.clarityAchieved === 'Sediment Present';
  };

  const handleFlavorSuggestions = async () => {
    if (!apiKey) {
      alert('OpenAI API key is required for flavor suggestions. Please set it in settings.');
      return;
    }

    setIsGettingSuggestions(true);
    try {
      const prompt = `
You are a kombucha flavor consultant. Based on this batch information, suggest 3-5 flavor combinations:

Batch Info:
- Tea Type: ${batch.teaType}
- Sugar Type: ${batch.sugarType}
- Taste Profile: ${batch.tasteProfile || 'Not specified'}
- Current Flavoring: ${localBatch.flavorIngredients || 'None'}

Provide creative but balanced flavor suggestions that would complement this base. Focus on ingredients and ratios.

Respond with a JSON array of suggestions:
["suggestion 1", "suggestion 2", "suggestion 3"]
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
            { role: 'system', content: 'You are a kombucha flavor consultant. Always respond with valid JSON.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const suggestions = JSON.parse(data.choices[0]?.message?.content || '[]');
      setFlavorSuggestions(suggestions);
    } catch (error) {
      console.error('Flavor suggestion failed:', error);
      alert('Failed to get flavor suggestions. Please try again.');
    } finally {
      setIsGettingSuggestions(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-2 mb-6">
        <Droplets className="text-brewing-gold" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Flavoring & Filtering</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Flavoring Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Droplets className="text-brewing-gold" size={20} />
            <h3 className="font-semibold text-gray-800">Flavoring</h3>
            <button
              onClick={handleFlavorSuggestions}
              disabled={isGettingSuggestions || !apiKey || readOnly}
              className="ml-auto bg-brewing-gold hover:bg-brewing-amber text-white px-3 py-1 rounded-md flex items-center gap-1 text-sm transition-colors disabled:opacity-50"
            >
              {isGettingSuggestions ? (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
              ) : (
                <Lightbulb size={14} />
              )}
              Flavor Suggestions
            </button>
          </div>

          {/* Flavor Suggestions */}
          {flavorSuggestions.length > 0 && (
            <div className="bg-brewing-gold bg-opacity-10 p-4 rounded-md">
              <h4 className="font-semibold text-brewing-copper mb-2">AI Flavor Suggestions</h4>
              <ul className="text-sm text-brewing-copper space-y-1">
                {flavorSuggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Lightbulb size={12} className="mt-0.5 flex-shrink-0" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flavoring Method
            </label>
            <select
              value={localBatch.flavoringMethod || ''}
              onChange={(e) => handleInputChange('flavoringMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
            >
              <option value="">Select method...</option>
              {FLAVORING_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {localBatch.flavoringMethod && localBatch.flavoringMethod !== 'None' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flavor Ingredients Used
                </label>
                <input
                  type="text"
                  value={localBatch.flavorIngredients || ''}
                  onChange={(e) => handleInputChange('flavorIngredients', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
                  placeholder="e.g., Fresh Ginger, Raspberry Puree"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sterilized / Pasteurized?
                </label>
                <select
                  value={localBatch.sterilized ? 'Yes' : 'No'}
                  onChange={(e) => handleInputChange('sterilized', e.target.value === 'Yes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flavoring Notes
                </label>
                <textarea
                  value={localBatch.flavoringNotes || ''}
                  onChange={(e) => handleInputChange('flavoringNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-gold focus:border-transparent"
                  rows={2}
                  placeholder="Notes about flavoring process, ratios, etc."
                />
              </div>

              {showFilteringWarning() && (
                <div className="flex items-start gap-2 p-3 bg-brewing-warning bg-opacity-10 border border-brewing-warning rounded-md">
                  <AlertTriangle size={16} className="text-brewing-warning mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-semibold">Warning:</span> Unsterilized juice without filtering may introduce contaminants. Consider pasteurizing ingredients or adding filtration.
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Filtering Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="text-brewing-darkGreen" size={20} />
            <h3 className="font-semibold text-gray-800">Filtering</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtering Method
            </label>
            <select
              value={localBatch.filteringMethod || ''}
              onChange={(e) => handleInputChange('filteringMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-darkGreen focus:border-transparent"
            >
              <option value="">Select method...</option>
              {FILTERING_METHODS.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {localBatch.filteringMethod && localBatch.filteringMethod !== 'None' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Filtered
                </label>
                <input
                  type="date"
                  value={localBatch.dateFiltered || ''}
                  onChange={(e) => handleInputChange('dateFiltered', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-darkGreen focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtering Notes
                </label>
                <textarea
                  value={localBatch.filteringNotes || ''}
                  onChange={(e) => handleInputChange('filteringNotes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-darkGreen focus:border-transparent"
                  rows={2}
                  placeholder="Notes about filtering process, equipment used, etc."
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clarity Achieved?
            </label>
            <select
              value={localBatch.clarityAchieved || ''}
              onChange={(e) => handleInputChange('clarityAchieved', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-darkGreen focus:border-transparent"
            >
              <option value="">Select clarity level...</option>
              {CLARITY_LEVELS.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          {showClarityWarning() && (
            <div className="flex items-start gap-2 p-3 bg-brewing-warning bg-opacity-10 border border-brewing-warning rounded-md">
              <AlertTriangle size={16} className="text-brewing-warning mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Suggestion:</span> Sediment present - consider re-filtering with a finer mesh or cold crashing to improve clarity before bottling.
              </div>
            </div>
          )}

          {/* Status Indicator */}
          {localBatch.flavoringMethod && localBatch.clarityAchieved && (
            <div className="mt-6 p-3 bg-brewing-success bg-opacity-10 border border-brewing-success rounded-md">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-brewing-success" />
                <span className="font-semibold text-sm text-brewing-success">
                  Flavoring & Filtering Complete
                </span>
              </div>
              <div className="text-xs text-brewing-success mt-1">
                Ready to proceed to carbonation and bottling
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};