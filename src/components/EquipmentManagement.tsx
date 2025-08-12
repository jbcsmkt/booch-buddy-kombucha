import React, { useState, useEffect } from 'react';
import { Wrench, Plus, Calendar, AlertTriangle, CheckCircle, Edit, Trash2, Clock } from 'lucide-react';
import { ExtendedEquipment as Equipment } from '../types/extended';
import { equipmentService } from '../services/placeholderServices';
import { format, addDays, isAfter, parseISO } from 'date-fns';

const EQUIPMENT_TYPES = [
  'Fermenter',
  'Bottles',
  'Kegs',
  'pH Meter',
  'Refractometer',
  'Thermometer',
  'Tubing',
  'Airlock',
  'Siphon',
  'Sanitizer',
  'Other'
];

const MAINTENANCE_SCHEDULES = [
  'Daily',
  'Weekly',
  'Bi-weekly',
  'Monthly',
  'Quarterly',
  'Semi-annually',
  'Annually',
  'As needed'
];

export const EquipmentManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [isAddingEquipment, setIsAddingEquipment] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    type: '',
    maintenance_schedule: '',
    notes: ''
  });

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const data = await equipmentService.getAll();
      setEquipment(data as any);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    }
  };

  const handleAddEquipment = async () => {
    if (!newEquipment.name || !newEquipment.type) return;

    try {
      const equipmentData: Omit<Equipment, 'id' | 'created_at' | 'updated_at'> = {
        name: newEquipment.name,
        type: newEquipment.type,
        capacity: undefined,
        notes: newEquipment.notes || undefined,
        last_sanitized: newEquipment.maintenance_schedule || undefined,
        is_active: true
      };

      await equipmentService.create(equipmentData);
      await loadEquipment();
      setIsAddingEquipment(false);
      setNewEquipment({ name: '', type: '', maintenance_schedule: '', notes: '' });
    } catch (error) {
      console.error('Failed to add equipment:', error);
      alert('Failed to save equipment');
    }
  };

  const handleUpdateEquipment = async () => {
    if (!editingEquipment) return;

    try {
      await equipmentService.update(editingEquipment.id, {
        name: editingEquipment.name,
        type: editingEquipment.type,
        notes: editingEquipment.notes
      });
      await loadEquipment();
      setEditingEquipment(null);
    } catch (error) {
      console.error('Failed to update equipment:', error);
      alert('Failed to update equipment');
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await equipmentService.delete(id);
        await loadEquipment();
      } catch (error) {
        console.error('Failed to delete equipment:', error);
        alert('Failed to delete equipment');
      }
    }
  };

  const handleMarkCleaned = async (equipmentItem: Equipment) => {
    try {
      await equipmentService.update(equipmentItem.id, {
        last_sanitized: new Date().toISOString()
      });
      await loadEquipment();
    } catch (error) {
      console.error('Failed to update cleaning date:', error);
      alert('Failed to update cleaning date');
    }
  };

  const getMaintenanceStatus = (equipmentItem: Equipment) => {
    if (!equipmentItem.last_cleaned || !equipmentItem.maintenance_schedule) {
      return { status: 'unknown', daysOverdue: 0 };
    }

    const lastCleaned = parseISO(equipmentItem.last_cleaned);
    const schedule = equipmentItem.maintenance_schedule;
    
    let intervalDays = 0;
    switch (schedule) {
      case 'Daily': intervalDays = 1; break;
      case 'Weekly': intervalDays = 7; break;
      case 'Bi-weekly': intervalDays = 14; break;
      case 'Monthly': intervalDays = 30; break;
      case 'Quarterly': intervalDays = 90; break;
      case 'Semi-annually': intervalDays = 180; break;
      case 'Annually': intervalDays = 365; break;
      default: return { status: 'unknown', daysOverdue: 0 };
    }

    const nextDue = addDays(lastCleaned, intervalDays);
    const now = new Date();
    
    if (isAfter(now, nextDue)) {
      const daysOverdue = Math.floor((now.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
      return { status: 'overdue', daysOverdue };
    } else {
      const daysToDue = Math.floor((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToDue <= 1) {
        return { status: 'due-soon', daysOverdue: 0 };
      } else {
        return { status: 'good', daysOverdue: 0 };
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'text-brewing-danger bg-red-50 border-red-200';
      case 'due-soon': return 'text-brewing-warning bg-yellow-50 border-yellow-200';
      case 'good': return 'text-brewing-success bg-green-50 border-green-200';
      default: return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'overdue': return <AlertTriangle size={16} className="text-brewing-danger" />;
      case 'due-soon': return <Clock size={16} className="text-brewing-warning" />;
      case 'good': return <CheckCircle size={16} className="text-brewing-success" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const overdueEquipment = equipment.filter(item => getMaintenanceStatus(item).status === 'overdue');
  const dueSoonEquipment = equipment.filter(item => getMaintenanceStatus(item).status === 'due-soon');

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wrench className="text-brewing-copper" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Equipment Management</h2>
        </div>
        <button
          onClick={() => setIsAddingEquipment(true)}
          className="bg-brewing-amber hover:bg-brewing-copper text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={16} />
          Add Equipment
        </button>
      </div>

      {/* Maintenance Alerts */}
      {(overdueEquipment.length > 0 || dueSoonEquipment.length > 0) && (
        <div className="mb-6 space-y-3">
          {overdueEquipment.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="text-brewing-danger" size={20} />
                <h3 className="font-semibold text-red-800">Overdue Maintenance</h3>
              </div>
              <div className="space-y-1">
                {overdueEquipment.map(item => {
                  const { daysOverdue } = getMaintenanceStatus(item);
                  return (
                    <div key={item.id} className="text-sm text-red-700">
                      <strong>{item.name}</strong> - {daysOverdue} days overdue
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {dueSoonEquipment.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="text-brewing-warning" size={20} />
                <h3 className="font-semibold text-yellow-800">Maintenance Due Soon</h3>
              </div>
              <div className="space-y-1">
                {dueSoonEquipment.map(item => (
                  <div key={item.id} className="text-sm text-yellow-700">
                    <strong>{item.name}</strong> - Due within 24 hours
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Equipment Form */}
      {isAddingEquipment && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Add New Equipment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name</label>
              <input
                type="text"
                value={newEquipment.name}
                onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="e.g., Primary Fermenter #1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type</label>
              <select
                value={newEquipment.type}
                onChange={(e) => setNewEquipment(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              >
                <option value="">Select type...</option>
                {EQUIPMENT_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Schedule</label>
              <select
                value={newEquipment.maintenance_schedule}
                onChange={(e) => setNewEquipment(prev => ({ ...prev, maintenance_schedule: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
              >
                <option value="">Select schedule...</option>
                {MAINTENANCE_SCHEDULES.map(schedule => (
                  <option key={schedule} value={schedule}>{schedule}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={newEquipment.notes}
                onChange={(e) => setNewEquipment(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAddEquipment}
              className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg transition-colors"
            >
              Add Equipment
            </button>
            <button
              onClick={() => setIsAddingEquipment(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Equipment List */}
      {equipment.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Equipment Tracked</h3>
          <p className="text-gray-500">Start tracking your brewing equipment and maintenance schedules.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Cleaned
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {equipment.map((item) => {
                const maintenanceStatus = getMaintenanceStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.notes && (
                          <div className="text-sm text-gray-500">{item.notes}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                        {item.type}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.last_cleaned ? (
                        <div className="flex items-center gap-1">
                          <Calendar size={12} />
                          {format(new Date(item.last_cleaned), 'MMM dd, yyyy')}
                        </div>
                      ) : (
                        'Never'
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.maintenance_schedule || 'Not set'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(maintenanceStatus.status)}`}>
                        {getStatusIcon(maintenanceStatus.status)}
                        {maintenanceStatus.status === 'overdue' && `${maintenanceStatus.daysOverdue}d overdue`}
                        {maintenanceStatus.status === 'due-soon' && 'Due soon'}
                        {maintenanceStatus.status === 'good' && 'Good'}
                        {maintenanceStatus.status === 'unknown' && 'Unknown'}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleMarkCleaned(item)}
                          className="text-brewing-success hover:text-brewing-darkGreen transition-colors"
                          title="Mark as cleaned"
                        >
                          <CheckCircle size={16} />
                        </button>
                        <button
                          onClick={() => setEditingEquipment(item)}
                          className="text-brewing-copper hover:text-brewing-amber transition-colors"
                          title="Edit equipment"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEquipment(item.id)}
                          className="text-brewing-danger hover:text-red-700 transition-colors"
                          title="Delete equipment"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">Edit Equipment</h3>
              <button
                onClick={() => setEditingEquipment(null)}
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
                  value={editingEquipment.name}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={editingEquipment.type}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, type: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                >
                  {EQUIPMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Schedule</label>
                <select
                  value={editingEquipment.maintenance_schedule || ''}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, maintenance_schedule: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                >
                  <option value="">Select schedule...</option>
                  {MAINTENANCE_SCHEDULES.map(schedule => (
                    <option key={schedule} value={schedule}>{schedule}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={editingEquipment.notes || ''}
                  onChange={(e) => setEditingEquipment(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button
                onClick={() => setEditingEquipment(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateEquipment}
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