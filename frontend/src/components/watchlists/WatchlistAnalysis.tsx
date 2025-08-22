// src/components/watchlists/WatchlistAnalysis.tsx
import React from 'react';
import { TrendChart } from '../trends/TrendChart';
import { 
  CalendarIcon, 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon 
} from '@heroicons/react/24/outline';
import { type Watchlist } from '../../types';

interface AnalysisData {
  trends: any;
  insights: any;
  summary: {
    total_keywords: number;
    rising_trends: number;
    falling_trends: number;
    stable_trends: number;
    analysis_date: string;
  };
}

interface WatchlistAnalysisProps {
  watchlist: Watchlist;
  analysisData: AnalysisData;
  onClose?: () => void;
}

const WatchlistAnalysis: React.FC<WatchlistAnalysisProps> = ({
  watchlist,
  analysisData,
  onClose
}) => {
  const { trends, insights, summary } = analysisData;

  const trendIcons = {
    rising: <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />,
    falling: <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />,
    stable: <MinusIcon className="h-5 w-5 text-gray-600" />
  };

  const summaryStats = [
    {
      label: 'Total Keywords',
      value: summary.total_keywords,
      icon: <ChartBarIcon className="h-5 w-5 text-blue-600" />,
      color: 'text-blue-600'
    },
    {
      label: 'Rising Trends',
      value: summary.rising_trends,
      icon: <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />,
      color: 'text-green-600'
    },
    {
      label: 'Falling Trends',
      value: summary.falling_trends,
      icon: <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />,
      color: 'text-red-600'
    },
    {
      label: 'Stable Trends',
      value: summary.stable_trends,
      icon: <MinusIcon className="h-5 w-5 text-gray-600" />,
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{watchlist.name}</h2>
            <p className="text-gray-600">Watchlist Analysis Report</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          )}
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4" />
            <span>Analyzed: {new Date(summary.analysis_date).toLocaleDateString()}</span>
          </div>
          <span>•</span>
          <span>{summary.total_keywords} keywords tracked</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryStats.map((stat, index) => (
          <div key={index} className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {stat.icon}
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className={`text-lg font-semibold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trend Chart */}
      {trends && Object.keys(trends).length > 0 && (
        <TrendChart
          data={trends}
          keywords={Object.keys(trends)}
          insights={insights}
          title={`${watchlist.name} - Trend Analysis`}
          height={500}
        />
      )}

      {/* Detailed Insights */}
      {insights && Object.keys(insights).length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed Insights</h3>
          
          <div className="space-y-4">
            {Object.entries(insights).map(([keyword, insight]: [string, any]) => (
              <div key={keyword} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{keyword}</h4>
                  <div className="flex items-center space-x-2">
                    {trendIcons[insight.trend_direction as keyof typeof trendIcons]}
                    <span className="text-sm font-medium capitalize">
                      {insight.trend_direction}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Average Interest</p>
                    <p className="font-medium">{insight.avg_interest?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Peak Interest</p>
                    <p className="font-medium">{insight.max_interest?.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Volatility</p>
                    <p className="font-medium">{(insight.volatility * 100)?.toFixed(1)}%</p>
                  </div>
                  {insight.predicted_category && (
                    <div>
                      <p className="text-gray-600">Category</p>
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        {insight.predicted_category}
                      </span>
                    </div>
                  )}
                </div>

                {insight.recommendations && insight.recommendations.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-2">Recommendations:</p>
                    <ul className="text-sm space-y-1">
                      {insight.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-gray-700">
                          • {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WatchlistAnalysis;