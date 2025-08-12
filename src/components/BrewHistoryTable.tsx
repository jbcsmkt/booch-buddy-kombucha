import React from 'react';
import { Edit, Trash2, Calendar, TestTube, Droplets, Eye, Plus, BarChart3 } from 'lucide-react';
import { BatchData } from '../types/brewing';
import { format, parseISO } from 'date-fns';

interface BrewHistoryTableProps {
  batches: BatchData[];
  onEdit: (batch: BatchData) => void;
  onView: (batch: BatchData) => void;
  onDelete: (batchId: string | number) => void;
  onAddData: (batch: BatchData) => void;
}

export const BrewHistoryTable: React.FC<BrewHistoryTableProps> = ({ batches, onEdit, onView, onDelete, onAddData }) => {
  const getStatusColor = (status: BatchData['status']) => {
    switch (status) {
      case 'needs-attention': return 'bg-brewing-danger text-white';
      case 'in-progress': return 'bg-brewing-warning text-white';
      case 'ready': return 'bg-brewing-success text-white';
      case 'complete': return 'bg-brewing-darkGreen text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: BatchData['status']) => {
    switch (status) {
      case 'needs-attention': return 'Needs Attention';
      case 'in-progress': return 'In Progress';
      case 'ready': return 'Ready';
      case 'complete': return 'Complete';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid Date';
    }
  };

  const handleDelete = (batch: BatchData) => {
    if (window.confirm(`Are you sure you want to delete Batch ${batch.batchNumber}? This action cannot be undone.`)) {
      onDelete(batch.id);
    }
  };

  if (batches.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <TestTube className="mx-auto text-gray-400 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Batches Yet</h3>
        <p className="text-gray-500">Start by creating your first kombucha batch above.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800">Brew History</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Final Measurements
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Flavor Summary
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
            {batches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      Batch {batch.batchNumber}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar size={12} />
                      {formatDate(batch.startDate)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {batch.brewSize} gal • {batch.teaType}
                      {batch.aiStatus && (
                        <div className={`inline-block ml-2 px-2 py-0.5 rounded-full text-xs ${
                          batch.aiStatus === 'Ready to bottle' 
                            ? 'bg-brewing-success text-white' 
                            : 'bg-brewing-warning text-white'
                        }`}>
                          {batch.aiStatus}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        batch.progressPercentage === 100 ? 'bg-brewing-success' :
                        batch.progressPercentage >= 75 ? 'bg-brewing-gold' :
                        batch.progressPercentage >= 50 ? 'bg-brewing-warning' :
                        batch.progressPercentage > 0 ? 'bg-brewing-copper' : 'bg-gray-400'
                      }`}
                      style={{ width: `${batch.progressPercentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {batch.progressPercentage}% complete
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm">
                    {batch.finalPH && batch.finalBrix ? (
                      <div className="flex items-center gap-1">
                        <TestTube size={12} className="text-brewing-copper" />
                        <span>pH {batch.finalPH} • {batch.finalBrix}°Bx</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                    {batch.alcoholEstimate && (
                      <div className="text-xs text-gray-500">
                        ~{batch.alcoholEstimate.toFixed(1)}% ABV
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="text-sm">
                    {batch.secondaryFlavoringAdded ? (
                      <div className="flex items-center gap-1">
                        <Droplets size={12} className="text-brewing-gold" />
                        <span>{batch.secondaryFlavoringAdded}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Unflavored</span>
                    )}
                    {batch.carbonationStatus && (
                      <div className="text-xs text-gray-500">
                        Carb: {batch.carbonationStatus}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(batch.status)}`}>
                    {getStatusText(batch.status)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(batch.lastEntryDate)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onView(batch)}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                      title="View batch"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(batch)}
                      className="text-brewing-copper hover:text-brewing-amber transition-colors"
                      title="Edit batch"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onAddData(batch)}
                      className="text-brewing-success hover:text-brewing-darkGreen transition-colors"
                      title="Add data entry for AI analysis"
                    >
                      <BarChart3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(batch)}
                      className="text-brewing-danger hover:text-red-700 transition-colors"
                      title="Delete batch"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};