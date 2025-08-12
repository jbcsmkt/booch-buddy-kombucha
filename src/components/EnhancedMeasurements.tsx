import React, { useState, useEffect } from 'react';
import { Plus, TrendingUp, Thermometer, Droplets, Activity, Trash2, Edit } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { ExtendedEnhancedMeasurement as EnhancedMeasurement } from '../types/extended';
import { enhancedMeasurementService } from '../services/placeholderServices';
import { format } from 'date-fns';

interface EnhancedMeasurementsProps {
  batch: BatchData;
  readOnly?: boolean;
}

const MEASUREMENT_TYPES = [
  { type: 'dissolved_oxygen', label: 'Dissolved Oxygen', unit: 'ppm', icon: Activity },
  { type: 'specific_gravity', label: 'Specific Gravity', unit: 'SG', icon: Droplets },
  { type: 'yeast_count', label: 'Yeast Cell Count', unit: 'cells/ml', icon: Activity },
  { type: 'turbidity', label: 'Turbidity', unit: 'NTU', icon: TrendingUp },
  { type: 'color_srm', label: 'Color (SRM)', unit: 'SRM', icon: Droplets },
  { type: 'alcohol_content', label: 'Alcohol Content', unit: '%', icon: Thermometer }
];

export const EnhancedMeasurements: React.FC<EnhancedMeasurementsProps> = ({ batch, readOnly = false }) => {
  const [measurements, setMeasurements] = useState<EnhancedMeasurement[]>([]);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState<EnhancedMeasurement | null>(null);
  const [newMeasurement, setNewMeasurement] = useState({
    measurement_type: '',
    value: '',
    recorded_at: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    if (batch.id) {
      loadMeasurements();
    }
  }, [batch.id]);

  const loadMeasurements = async () => {
    try {
      const data = await enhancedMeasurementService.getByBatchId(batch.id);
      setMeasurements(data as any);
    } catch (error) {
      console.error('Failed to load measurements:', error);
    }
  };

  const handleAddMeasurement = async () => {
    if (!newMeasurement.measurement_type || !newMeasurement.value) return;

    try {
      const measurementType = newMeasurement.measurement_type;
      const value = parseFloat(newMeasurement.value);
      
      const measurementData: any = {
        batch_id: batch.id,
        measurement_date: newMeasurement.recorded_at,
        notes: newMeasurement.notes || undefined,
        // Map measurement type to appropriate field
        ...(measurementType === 'specific_gravity' && { specific_gravity: value }),
        ...(measurementType === 'alcohol_content' && { alcohol_content: value }),
        ...(measurementType === 'dissolved_oxygen' && { ph: value }), // Using ph for DO temporarily
        ...(measurementType === 'yeast_count' && { brix: value }), // Using brix for yeast count temporarily
        ...(measurementType === 'turbidity' && { temperature: value }), // Using temperature for turbidity temporarily
        ...(measurementType === 'color_srm' && { acidity: value }) // Using acidity for color temporarily
      };

      await enhancedMeasurementService.create(measurementData);
      await loadMeasurements();
      setIsAddingMeasurement(false);
      setNewMeasurement({
        measurement_type: '',
        value: '',
        recorded_at: new Date().toISOString().split('T')[0],
        notes: ''
      });
    } catch (error) {
      console.error('Failed to add measurement:', error);
      alert('Failed to save measurement');
    }
  };

  const handleUpdateMeasurement = async () => {
    if (!editingMeasurement) return;

    try {
      await enhancedMeasurementService.update(editingMeasurement.id, {
        notes: editingMeasurement.notes,
        measurement_date: editingMeasurement.measurement_date
      });
      await loadMeasurements();
      setEditingMeasurement(null);
    } catch (error) {
      console.error('Failed to update measurement:', error);
      alert('Failed to update measurement');
    }
  };

  const handleDeleteMeasurement = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this measurement?')) {
      try {
        await enhancedMeasurementService.delete(id);
        await loadMeasurements();
      } catch (error) {
        console.error('Failed to delete measurement:', error);
        alert('Failed to delete measurement');
      }
    }
  };

  const getMeasurementIcon = (type: string) => {
    const measurementType = MEASUREMENT_TYPES.find(t => t.type === type);
    const IconComponent = measurementType?.icon || Activity;
    return <IconComponent size={16} className="text-brewing-copper" />;
  };

  const getMeasurementLabel = (type: string) => {
    return MEASUREMENT_TYPES.find(t => t.type === type)?.label || type;
  };

  const groupedMeasurements = measurements.reduce((acc, measurement) => {
    if (!acc[measurement.measurement_type]) {
      acc[measurement.measurement_type] = [];
    }
    acc[measurement.measurement_type].push(measurement);
    return acc;
  }, {} as Record<string, EnhancedMeasurement[]>);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="text-brewing-copper" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Enhanced Measurements</h2>
        </div>
        {!readOnly && (
          <button
            onClick={() => setIsAddingMeasurement(true)}
            className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={16} />
            Add Measurement
          </button>
        )}
      </div>

      {/* Add Measurement Form */}
      {isAddingMeasurement && !readOnly && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Measurement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Type</label>
              <select
                value={newMeasurement.measurement_type}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, measurement_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              >
                <option value="">Select measurement type...</option>
                {MEASUREMENT_TYPES.map(type => (
                  <option key={type.type} value={type.type}>{type.label} ({type.unit})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="number"
                step="0.01"
                value={newMeasurement.value}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Enter value"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Recorded</label>
              <input
                type="date"
                value={newMeasurement.recorded_at}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, recorded_at: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={newMeasurement.notes}
                onChange={(e) => setNewMeasurement(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddMeasurement}
              className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
            >
              Save Measurement
            </button>
            <button
              onClick={() => setIsAddingMeasurement(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Measurement Modal */}
      {editingMeasurement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Edit Measurement</h3>
              <button
                onClick={() => setEditingMeasurement(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingMeasurement.value}
                  onChange={(e) => setEditingMeasurement(prev => prev ? { ...prev, value: parseFloat(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={editingMeasurement.recorded_at.split('T')[0]}
                  onChange={(e) => setEditingMeasurement(prev => prev ? { ...prev, recorded_at: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingMeasurement.notes || ''}
                  onChange={(e) => setEditingMeasurement(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setEditingMeasurement(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateMeasurement}
                className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Measurements Display */}
      {Object.keys(groupedMeasurements).length === 0 ? (
        <div className="text-center py-8">
          <TrendingUp className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Enhanced Measurements</h3>
          <p className="text-gray-500">Start tracking advanced brewing metrics for better quality control.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeasurements).map(([type, typeMeasurements]) => (
            <div key={type} className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                {getMeasurementIcon(type)}
                <h3 className="font-semibold text-gray-800">{getMeasurementLabel(type)}</h3>
                <span className="text-sm text-gray-500">({typeMeasurements[0].unit})</span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Value</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                      {!readOnly && <th className="px-3 py-2 text-left">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {typeMeasurements
                      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                      .map((measurement) => (
                      <tr key={measurement.id} className="border-t">
                        <td className="px-3 py-2">
                          {format(new Date(measurement.recorded_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-3 py-2 font-medium">
                          {measurement.value} {measurement.unit}
                        </td>
                        <td className="px-3 py-2 text-gray-600">
                          {measurement.notes || '-'}
                        </td>
                        {!readOnly && (
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingMeasurement(measurement)}
                                className="text-brewing-copper hover:text-brewing-amber transition-colors"
                                title="Edit measurement"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteMeasurement(measurement.id)}
                                className="text-brewing-danger hover:text-red-700 transition-colors"
                                title="Delete measurement"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};