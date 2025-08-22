// src/components/trends/TrendComparison.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3, Download } from 'lucide-react';
import TrendsService, { type TrendData, type ComparisonResult } from '../../services/trends';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';

interface TrendComparisonProps {
  keywords: string[];
  timeframe?: "today 3-m" | "now 1-H" | "now 4-H" | "now 1-d" | "today 1-m" | "today 12-m" | "today 5-y";
  geo?: string;
  onComparisonComplete?: (result: ComparisonResult) => void;
}

const TrendComparison: React.FC<TrendComparisonProps> = ({
  keywords,
  timeframe = 'today 3-m',
  geo = 'US',
  onComparisonComplete
}) => {
  const [comparisonData, setComparisonData] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  useEffect(() => {
    if (keywords.length > 0) {
      fetchComparisonData();
    }
  }, [keywords, timeframe, geo]);

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await TrendsService.compareTrends(keywords, {
        timeframe,
        geo,
        include_ml: true
      });

      if (result.success && result.data) {
        setComparisonData(result.data);
        processChartData(result.data.data);
        onComparisonComplete?.(result.data);
      } else {
        setError(result.error || 'Failed to fetch comparison data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch comparison data');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (trends: TrendData[]) => {
    if (trends.length === 0) return;

    const processedData: any[] = [];
    const maxLength = Math.max(...trends.map(trend => trend.timestamps.length));

    for (let i = 0; i < maxLength; i++) {
      const dataPoint: any = {};
      
      trends.forEach((trend, index) => {
        if (i < trend.timestamps.length) {
          if (!dataPoint.timestamp) {
            dataPoint.timestamp = new Date(trend.timestamps[i]).toLocaleDateString();
          }
          dataPoint[trend.keyword] = trend.search_volume[i] || 0;
        }
      });
      
      if (dataPoint.timestamp) {
        processedData.push(dataPoint);
      }
    }

    setChartData(processedData);
  };

  const calculateTrendDirection = (data: TrendData): 'up' | 'down' | 'stable' => {
    if (data.search_volume.length < 2) return 'stable';
    
    const firstHalf = data.search_volume.slice(0, Math.floor(data.search_volume.length / 2));
    const secondHalf = data.search_volume.slice(Math.floor(data.search_volume.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 10) return 'up';
    if (change < -10) return 'down';
    return 'stable';
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'stable') => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const exportData = () => {
    if (!comparisonData) return;
    
    const csvContent = [
      ['Keyword', 'Total Volume', 'Trend Direction', 'Peak Value'],
      ...comparisonData.data.map(trend => [
        trend.keyword,
        trend.search_volume.reduce((sum, val) => sum + val, 0),
        calculateTrendDirection(trend),
        Math.max(...trend.search_volume)
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trend-comparison-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <ErrorMessage message={error} onDismiss={fetchComparisonData} />
      </div>
    );
  }

  if (!comparisonData || comparisonData.data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comparison data</h3>
        <p className="text-gray-500">Add keywords to compare their trends.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Trend Comparison</h2>
            <p className="text-gray-600 mt-1">
              Comparing {keywords.length} keywords over {timeframe}
            </p>
          </div>
          <button
            onClick={exportData}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #D1D5DB',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              {keywords.map((keyword, index) => (
                <Line
                  key={keyword}
                  type="monotone"
                  dataKey={keyword}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {comparisonData.data.map((trend, index) => {
            const totalVolume = trend.search_volume.reduce((sum, val) => sum + val, 0);
            const avgVolume = totalVolume / trend.search_volume.length;
            const peakVolume = Math.max(...trend.search_volume);
            const trendDirection = calculateTrendDirection(trend);
            
            return (
              <div
                key={trend.keyword}
                className="bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 truncate">{trend.keyword}</h4>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(trendDirection)}
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors[index % colors.length] }}
                    />
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-medium">{totalVolume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Volume:</span>
                    <span className="font-medium">{Math.round(avgVolume).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Volume:</span>
                    <span className="font-medium">{peakVolume.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Best Performer */}
        {comparisonData.best_performing && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Best Performing Keyword
            </h4>
            <p className="text-blue-800">
              <span className="font-medium">{comparisonData.best_performing.keyword}</span>
              {' '}leads with {comparisonData.best_performing.value.toLocaleString()} total volume
            </p>
          </div>
        )}

        {/* Insights */}
        {comparisonData.insights && comparisonData.insights.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Key Insights</h4>
            <div className="space-y-2">
              {comparisonData.insights.slice(0, 3).map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-gray-700">{insight.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendComparison;