import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, Filter, Clock } from 'lucide-react';
import { BatchData, BatchInterval } from '../types/brewing';
import { batchService, batchIntervalService } from '../services/database';
import { format, parseISO, subDays, subMonths, isAfter } from 'date-fns';

interface AnalyticsData {
  totalBatches: number;
  completedBatches: number;
  averageSuccessRate: number;
  averageFermentationTime: number;
  popularTeaTypes: { type: string; count: number }[];
  popularSugarTypes: { type: string; count: number }[];
  monthlyProduction: { month: string; count: number }[];
  qualityTrends: { date: string; avgHealthScore: number }[];
  batchStatusDistribution: { status: string; count: number }[];
}

interface FilterOptions {
  dateRange: 'all' | '30d' | '90d' | '1y';
  teaType: string;
  status: string;
}

export const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [batches, setBatches] = useState<BatchData[]>([]);
  const [intervals, setIntervals] = useState<BatchInterval[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    teaType: '',
    status: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (batches.length > 0) {
      calculateAnalytics();
    }
  }, [batches, intervals, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [batchData, intervalData] = await Promise.all([
        batchService.getAll(),
        loadAllIntervals()
      ]);
      setBatches(batchData);
      setIntervals(intervalData);
    } catch (error) {
      console.error('Failed to load analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllIntervals = async (): Promise<BatchInterval[]> => {
    try {
      const batches = await batchService.getAll();
      const allIntervals: BatchInterval[] = [];
      
      for (const batch of batches) {
        const batchIntervals = await batchIntervalService.getByBatchId(batch.id);
        allIntervals.push(...batchIntervals);
      }
      
      return allIntervals;
    } catch (error) {
      console.error('Failed to load intervals:', error);
      return [];
    }
  };

  const getFilteredBatches = (): BatchData[] => {
    let filtered = [...batches];

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case '30d':
          cutoffDate = subDays(now, 30);
          break;
        case '90d':
          cutoffDate = subDays(now, 90);
          break;
        case '1y':
          cutoffDate = subMonths(now, 12);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      filtered = filtered.filter(batch => 
        isAfter(parseISO(batch.startDate), cutoffDate)
      );
    }

    // Tea type filter
    if (filters.teaType) {
      filtered = filtered.filter(batch => batch.teaType === filters.teaType);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(batch => batch.status === filters.status);
    }

    return filtered;
  };

  const calculateAnalytics = () => {
    const filteredBatches = getFilteredBatches();
    
    if (filteredBatches.length === 0) {
      setAnalyticsData({
        totalBatches: 0,
        completedBatches: 0,
        averageSuccessRate: 0,
        averageFermentationTime: 0,
        popularTeaTypes: [],
        popularSugarTypes: [],
        monthlyProduction: [],
        qualityTrends: [],
        batchStatusDistribution: []
      });
      return;
    }

    // Basic metrics
    const totalBatches = filteredBatches.length;
    const completedBatches = filteredBatches.filter(b => b.status === 'complete').length;
    const averageSuccessRate = totalBatches > 0 ? (completedBatches / totalBatches) * 100 : 0;

    // Average fermentation time
    const fermentationTimes = filteredBatches
      .filter(b => b.secondaryEndDate)
      .map(b => {
        const start = parseISO(b.startDate);
        const end = parseISO(b.secondaryEndDate!);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      });
    const averageFermentationTime = fermentationTimes.length > 0 
      ? fermentationTimes.reduce((a, b) => a + b, 0) / fermentationTimes.length 
      : 0;

    // Popular tea types
    const teaTypeCounts = filteredBatches.reduce((acc, batch) => {
      acc[batch.teaType] = (acc[batch.teaType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularTeaTypes = Object.entries(teaTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Popular sugar types
    const sugarTypeCounts = filteredBatches.reduce((acc, batch) => {
      acc[batch.sugarType] = (acc[batch.sugarType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const popularSugarTypes = Object.entries(sugarTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Monthly production
    const monthlyData = filteredBatches.reduce((acc, batch) => {
      const month = format(parseISO(batch.startDate), 'MMM yyyy');
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const monthlyProduction = Object.entries(monthlyData)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .slice(-12);

    // Quality trends (from intervals)
    const qualityData = intervals
      .filter(interval => interval.health_score && filteredBatches.some(b => b.id === interval.batch_id))
      .reduce((acc, interval) => {
        const date = format(parseISO(interval.recorded_at), 'MMM dd');
        if (!acc[date]) {
          acc[date] = { total: 0, count: 0 };
        }
        acc[date].total += interval.health_score!;
        acc[date].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);
    
    const qualityTrends = Object.entries(qualityData)
      .map(([date, data]) => ({ date, avgHealthScore: data.total / data.count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    // Batch status distribution
    const statusCounts = filteredBatches.reduce((acc, batch) => {
      acc[batch.status] = (acc[batch.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const batchStatusDistribution = Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }));

    setAnalyticsData({
      totalBatches,
      completedBatches,
      averageSuccessRate,
      averageFermentationTime,
      popularTeaTypes,
      popularSugarTypes,
      monthlyProduction,
      qualityTrends,
      batchStatusDistribution
    });
  };

  const exportData = () => {
    if (!analyticsData) return;

    const csvData = [
      ['Metric', 'Value'],
      ['Total Batches', analyticsData.totalBatches.toString()],
      ['Completed Batches', analyticsData.completedBatches.toString()],
      ['Success Rate', `${analyticsData.averageSuccessRate.toFixed(1)}%`],
      ['Avg Fermentation Time', `${analyticsData.averageFermentationTime.toFixed(1)} days`],
      [''],
      ['Popular Tea Types', ''],
      ...analyticsData.popularTeaTypes.map(item => [item.type, item.count.toString()]),
      [''],
      ['Popular Sugar Types', ''],
      ...analyticsData.popularSugarTypes.map(item => [item.type, item.count.toString()]),
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brewing-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-brewing-success';
      case 'ready': return 'bg-brewing-gold';
      case 'in-progress': return 'bg-brewing-warning';
      case 'needs-attention': return 'bg-brewing-danger';
      default: return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'complete': return 'Complete';
      case 'ready': return 'Ready';
      case 'in-progress': return 'In Progress';
      case 'needs-attention': return 'Needs Attention';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brewing-amber mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Data Available</h3>
          <p className="text-gray-500">Start brewing to see analytics and insights.</p>
        </div>
      </div>
    );
  }

  const uniqueTeaTypes = [...new Set(batches.map(b => b.teaType))].filter(Boolean);
  const uniqueStatuses = [...new Set(batches.map(b => b.status))];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-brewing-copper" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">Advanced Analytics</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportData}
            className="bg-brewing-success hover:bg-brewing-darkGreen text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="text-gray-600" size={16} />
          <h3 className="font-semibold text-gray-800">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value as FilterOptions['dateRange'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tea Type</label>
            <select
              value={filters.teaType}
              onChange={(e) => setFilters(prev => ({ ...prev, teaType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="">All Tea Types</option>
              {uniqueTeaTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brewing-amber focus:border-transparent"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{getStatusLabel(status)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-brewing-amber bg-opacity-10 p-6 rounded-lg border border-brewing-amber">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brewing-copper">Total Batches</p>
              <p className="text-3xl font-bold text-brewing-copper">{analyticsData.totalBatches}</p>
            </div>
            <BarChart3 className="text-brewing-amber" size={32} />
          </div>
        </div>

        <div className="bg-brewing-success bg-opacity-10 p-6 rounded-lg border border-brewing-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brewing-darkGreen">Success Rate</p>
              <p className="text-3xl font-bold text-brewing-darkGreen">{analyticsData.averageSuccessRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="text-brewing-success" size={32} />
          </div>
        </div>

        <div className="bg-brewing-gold bg-opacity-10 p-6 rounded-lg border border-brewing-gold">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brewing-copper">Completed</p>
              <p className="text-3xl font-bold text-brewing-copper">{analyticsData.completedBatches}</p>
            </div>
            <Calendar className="text-brewing-gold" size={32} />
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Avg Fermentation</p>
              <p className="text-3xl font-bold text-blue-700">{analyticsData.averageFermentationTime.toFixed(1)}d</p>
            </div>
            <Clock className="text-blue-500" size={32} />
          </div>
        </div>
      </div>

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Tea Types */}
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Popular Tea Types</h3>
          <div className="space-y-3">
            {analyticsData.popularTeaTypes.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${index === 0 ? 'bg-brewing-amber' : index === 1 ? 'bg-brewing-gold' : index === 2 ? 'bg-brewing-copper' : 'bg-gray-400'}`}></div>
                  <span className="text-sm font-medium">{item.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${index === 0 ? 'bg-brewing-amber' : index === 1 ? 'bg-brewing-gold' : index === 2 ? 'bg-brewing-copper' : 'bg-gray-400'}`}
                      style={{ width: `${(item.count / analyticsData.totalBatches) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Batch Status Distribution */}
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Batch Status Distribution</h3>
          <div className="space-y-3">
            {analyticsData.batchStatusDistribution.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded ${getStatusColor(item.status)}`}></div>
                  <span className="text-sm font-medium">{getStatusLabel(item.status)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getStatusColor(item.status)}`}
                      style={{ width: `${(item.count / analyticsData.totalBatches) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Production */}
        <div className="border rounded-lg p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Production Trend</h3>
          <div className="space-y-2">
            {analyticsData.monthlyProduction.slice(-6).map((item) => (
              <div key={item.month} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.month}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-brewing-amber"
                      style={{ width: `${(item.count / Math.max(...analyticsData.monthlyProduction.map(m => m.count))) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Trends */}
        {analyticsData.qualityTrends.length > 0 && (
          <div className="border rounded-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Quality Score Trends</h3>
            <div className="space-y-2">
              {analyticsData.qualityTrends.slice(-10).map((item) => (
                <div key={item.date} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${item.avgHealthScore >= 80 ? 'bg-brewing-success' : item.avgHealthScore >= 60 ? 'bg-brewing-warning' : 'bg-brewing-danger'}`}
                        style={{ width: `${item.avgHealthScore}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{item.avgHealthScore.toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-3">Key Insights</h3>
        <div className="space-y-2 text-sm text-blue-700">
          {analyticsData.averageSuccessRate >= 80 && (
            <p>✅ Excellent success rate! Your brewing process is highly consistent.</p>
          )}
          {analyticsData.averageSuccessRate < 60 && (
            <p>⚠️ Consider reviewing your brewing process to improve success rates.</p>
          )}
          {analyticsData.popularTeaTypes.length > 0 && (
            <p>🍵 {analyticsData.popularTeaTypes[0].type} tea is your most popular choice ({analyticsData.popularTeaTypes[0].count} batches).</p>
          )}
          {analyticsData.averageFermentationTime > 0 && (
            <p>⏱️ Average fermentation time is {analyticsData.averageFermentationTime.toFixed(1)} days.</p>
          )}
          {analyticsData.totalBatches >= 10 && (
            <p>🎉 You've brewed {analyticsData.totalBatches} batches! You're becoming a kombucha expert.</p>
          )}
        </div>
      </div>
    </div>
  );
};