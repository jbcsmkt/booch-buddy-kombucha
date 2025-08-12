import React from 'react';
import { BarChart3 } from 'lucide-react';

interface AdvancedAnalyticsProps {
  batches: any[];
}

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ batches }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="text-brewing-primary" size={24} />
        <h2 className="text-xl font-semibold text-gray-800">Advanced Analytics</h2>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Coming Soon!</h3>
        <p className="text-blue-600">
          Advanced analytics features are being migrated to the new MySQL backend. 
          This will include batch success rates, fermentation trends, and AI-powered insights.
        </p>
        <p className="text-blue-600 mt-2 text-sm">
          Currently showing {batches.length} batches in your collection.
        </p>
      </div>
    </div>
  );
};