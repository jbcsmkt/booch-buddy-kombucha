import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Copy, Trash2, Edit, Eye, Users } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { ExtendedRecipeTemplate as RecipeTemplate } from '../types/extended';
import { recipeTemplateService } from '../services/placeholderServices';
import { format } from 'date-fns';

interface RecipeTemplatesProps {
  onApplyTemplate?: (template: RecipeTemplate) => void;
  currentBatch?: BatchData;
}

export const RecipeTemplates: React.FC<RecipeTemplatesProps> = ({ onApplyTemplate, currentBatch }) => {
  const [templates, setTemplates] = useState<RecipeTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecipeTemplate | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<RecipeTemplate | null>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    is_public: false
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await recipeTemplateService.getAll(true);
      setTemplates(data as any);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleCreateTemplate = async () => {
    if (!currentBatch || !newTemplate.name) return;

    try {
      const templateData: any = {
        name: newTemplate.name,
        description: newTemplate.description,
        tea_type: currentBatch.teaType,
        tea_amount: currentBatch.teaWeight,
        sugar_type: currentBatch.sugarType,
        sugar_amount: currentBatch.sugarAmount,
        water_amount: currentBatch.waterVolume,
        steep_temp: currentBatch.teaSteepingTemp || 0,
        steep_time: currentBatch.teaSteepingTime || 0,
        fermentation_days: 14, // Default value
        notes: currentBatch.teaBlendNotes,
        is_favorite: false
      };

      await recipeTemplateService.create(templateData);
      await loadTemplates();
      setIsCreating(false);
      setNewTemplate({ name: '', description: '', is_public: false });
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to save template');
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;

    try {
      await recipeTemplateService.update(editingTemplate.id, {
        name: editingTemplate.name,
        description: editingTemplate.description
      });
      await loadTemplates();
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
      alert('Failed to update template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this recipe template?')) {
      try {
        await recipeTemplateService.delete(id);
        await loadTemplates();
      } catch (error) {
        console.error('Failed to delete template:', error);
        alert('Failed to delete template');
      }
    }
  };

  const handleApplyTemplate = (template: RecipeTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
  };

  const handleDuplicateTemplate = async (template: RecipeTemplate) => {
    try {
      const duplicateData: any = {
        name: `${template.name} (Copy)`,
        description: template.description,
        tea_type: template.tea_type,
        tea_amount: template.tea_amount,
        sugar_type: template.sugar_type,
        sugar_amount: template.sugar_amount,
        water_amount: template.water_amount,
        steep_temp: template.steep_temp,
        steep_time: template.steep_time,
        fermentation_days: template.fermentation_days,
        notes: template.notes,
        is_favorite: false
      };

      await recipeTemplateService.create(duplicateData);
      await loadTemplates();
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      alert('Failed to duplicate template');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="text-brewing-gold" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Recipe Templates</h2>
        </div>
        {currentBatch && (
          <button
            onClick={() => setIsCreating(true)}
            className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Save as Template
          </button>
        )}
      </div>

      {/* Create Template Form */}
      {isCreating && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Save Current Batch as Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="e.g., Classic Green Tea Kombucha"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newTemplate.description}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                rows={3}
                placeholder="Describe this recipe and any special notes..."
              />
            </div>
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newTemplate.is_public}
                  onChange={(e) => setNewTemplate(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm">Make this template public (visible to other users)</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreateTemplate}
              className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save Template
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Recipe Templates</h3>
          <p className="text-gray-500">Save successful batches as templates for consistent brewing.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <div key={template.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-1">{template.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                </div>
                {template.is_public && (
                  <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    <Users size={12} />
                    Public
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-500 mb-3">
                <div>Created: {format(new Date(template.created_at), 'MMM dd, yyyy')}</div>
                <div>Tea: {template.tea_type} • Sugar: {template.sugar_type}</div>
                <div>Water: {template.water_amount} gal • Fermentation: {template.fermentation_days} days</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingTemplate(template)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="View details"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => handleDuplicateTemplate(template)}
                  className="text-brewing-copper hover:text-brewing-amber transition-colors"
                  title="Duplicate template"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => setEditingTemplate(template)}
                  className="text-gray-600 hover:text-gray-800 transition-colors"
                  title="Edit template"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-brewing-danger hover:text-red-700 transition-colors"
                  title="Delete template"
                >
                  <Trash2 size={16} />
                </button>
                {onApplyTemplate && (
                  <button
                    onClick={() => handleApplyTemplate(template)}
                    className="ml-auto bg-brewing-success hover:bg-brewing-darkGreen text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">{viewingTemplate.name}</h3>
              <button
                onClick={() => setViewingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-800 mb-2">Description</h4>
                <p className="text-gray-600">{viewingTemplate.description || 'No description provided'}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Brewing Details</h4>
                  <div className="space-y-1">
                    <div><span className="text-gray-600">Size:</span> {viewingTemplate.recipe_data.brewSize} gal</div>
                    <div><span className="text-gray-600">Tea:</span> {viewingTemplate.recipe_data.teaType}</div>
                    <div><span className="text-gray-600">Sugar:</span> {viewingTemplate.recipe_data.sugarType}</div>
                    <div><span className="text-gray-600">Method:</span> {viewingTemplate.recipe_data.method || 'Standard'}</div>
                    {viewingTemplate.recipe_data.teaSteepingTemp && (
                      <div><span className="text-gray-600">Steep Temp:</span> {viewingTemplate.recipe_data.teaSteepingTemp}°F</div>
                    )}
                    {viewingTemplate.recipe_data.teaSteepingTime && (
                      <div><span className="text-gray-600">Steep Time:</span> {viewingTemplate.recipe_data.teaSteepingTime} min</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Ratios & Amounts</h4>
                  <div className="space-y-1">
                    <div><span className="text-gray-600">Tea Weight:</span> {viewingTemplate.recipe_data.teaWeight} oz</div>
                    <div><span className="text-gray-600">Sugar Amount:</span> {viewingTemplate.recipe_data.sugarAmount} cups</div>
                    <div><span className="text-gray-600">Starter Tea:</span> {viewingTemplate.recipe_data.starterTea} fl oz</div>
                    <div><span className="text-gray-600">Water Volume:</span> {viewingTemplate.recipe_data.waterVolume} gal</div>
                  </div>
                </div>
                
                {viewingTemplate.recipe_data.flavoringMethod && viewingTemplate.recipe_data.flavoringMethod !== 'None' && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Flavoring</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Method:</span> {viewingTemplate.recipe_data.flavoringMethod}</div>
                      {viewingTemplate.recipe_data.flavorIngredients && (
                        <div><span className="text-gray-600">Ingredients:</span> {viewingTemplate.recipe_data.flavorIngredients}</div>
                      )}
                      {viewingTemplate.recipe_data.flavoringAmount && (
                        <div><span className="text-gray-600">Amount:</span> {viewingTemplate.recipe_data.flavoringAmount} fl oz</div>
                      )}
                    </div>
                  </div>
                )}
                
                {viewingTemplate.recipe_data.targetStartPH && (
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Target Values</h4>
                    <div className="space-y-1">
                      <div><span className="text-gray-600">Start pH:</span> {viewingTemplate.recipe_data.targetStartPH}</div>
                      <div><span className="text-gray-600">Start Brix:</span> {viewingTemplate.recipe_data.targetStartBrix}°Bx</div>
                      {viewingTemplate.recipe_data.targetEndPH && (
                        <div><span className="text-gray-600">End pH:</span> {viewingTemplate.recipe_data.targetEndPH}</div>
                      )}
                      {viewingTemplate.recipe_data.targetEndBrix && (
                        <div><span className="text-gray-600">End Brix:</span> {viewingTemplate.recipe_data.targetEndBrix}°Bx</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              {onApplyTemplate && (
                <button
                  onClick={() => {
                    handleApplyTemplate(viewingTemplate);
                    setViewingTemplate(null);
                  }}
                  className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Apply Template
                </button>
              )}
              <button
                onClick={() => setViewingTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Edit Template</h3>
              <button
                onClick={() => setEditingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingTemplate.description || ''}
                  onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                  rows={3}
                />
              </div>
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingTemplate.is_public}
                    onChange={(e) => setEditingTemplate(prev => prev ? { ...prev, is_public: e.target.checked } : null)}
                    className="mr-2"
                  />
                  <span className="text-sm">Make this template public</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setEditingTemplate(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTemplate}
                className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};