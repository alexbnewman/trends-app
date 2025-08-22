// src/components/trends/TrendChart.tsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TrendData {
  [keyword: string]: {
    values: number[];
    analytics?: {
      avg_interest: number;
      max_interest: number;
      trend_direction: 'rising' | 'falling' | 'stable';
      volatility: number;
      predicted_category?: string;
    };
  };
}

interface TrendChartProps {
  data: TrendData;
  keywords: string[];
  insights?: { [keyword: string]: any };
  title?: string;
  height?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ 
  data, 
  keywords, 
  insights = {}, 
  title = "Trend Analysis",
  height = 400 
}) => {
  // Transform data for recharts
  const chartData = React.useMemo(() => {
    if (!data || Object.keys(data).length === 0) return [];
    
    const firstKeyword = Object.keys(data)[0];
    const dataLength = data[firstKeyword]?.values?.length || 0;
    
    return Array.from({ length: dataLength }, (_, index) => {
      const point: any = { index: index + 1 };
      Object.keys(data).forEach(keyword => {
        if (data[keyword]?.values) {
          point[keyword] = data[keyword].values[index] || 0;
        }
      });
      return point;
    });
  }, [data]);

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const formatTooltip = (value: any, name: string) => [
    `${value}%`,
    name
  ];

  if (!chartData.length) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="text-center py-8">
          <p className="text-gray-500">No trend data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">Interest over time comparison</p>
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="index" 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            label={{ value: 'Interest (%)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={formatTooltip}
            labelFormatter={(label) => `Period ${label}`}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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

      {/* ML Insights */}
      {Object.keys(insights).length > 0 && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">AI Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(insights).map(([keyword, insight]: [string, any]) => (
              <div key={keyword} className="bg-gray-50 p-4 rounded-lg border">
                <h5 className="font-medium text-gray-900 mb-3">{keyword}</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Direction:</span>
                    <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                      insight.trend_direction === 'rising' ? 'bg-green-100 text-green-700' :
                      insight.trend_direction === 'falling' ? 'bg-red-100 text-red-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {insight.trend_direction}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Volatility:</span>
                    <span className="font-medium">{(insight.volatility * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Interest:</span>
                    <span className="font-medium">{insight.avg_interest.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak Interest:</span>
                    <span className="font-medium">{insight.max_interest.toFixed(1)}%</span>
                  </div>
                  {insight.predicted_category && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium text-blue-600 text-xs bg-blue-50 px-2 py-1 rounded-full">
                        {insight.predicted_category}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};