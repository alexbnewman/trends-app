// src/components/analysis/AnalysisDetail.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TrendsService, { type TrendData, type TrendInsight, type TrendPrediction } from '../../services/trends';
import MLPredictions from './MLPredictions';
import TrendInsights from '../trends/TrendInsights';
import Loading from '../common/Loading';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar, 
  Globe, 
  Hash,
  Eye,
  Download,
  Share2,
  BookmarkPlus
} from 'lucide-react';

interface Analysis {
  id: number;
  keywords: string[];
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  insights_count: number;
  timeframe: string;
  geo: string;
  total_volume?: number;
  peak_date?: string;
  trend_direction?: 'rising' | 'falling' | 'stable';
}

interface AnalysisDetailProps {
  analysis: Analysis;
}

interface DetailedTrendData extends TrendData {
  insights?: TrendInsight[];
  predictions?: TrendPrediction;
  pattern_analysis?: {
    trend_type: string;
    growth_rate: number;
    volatility: number;
    seasonal_strength?: number;
  };
}

const AnalysisDetail: React.FC<AnalysisDetailProps> = ({ analysis }) => {
  const [trendData, setTrendData] = useState<DetailedTrendData[]>([]);
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'predictions' | 'insights'>('overview');
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchDetailedData();
  }, [analysis]);

  const fetchDetailedData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch trend data
      const allowedTimeframes = [
        'now 1-H', 'now 4-H', 'now 1-d', 'today 1-m', 'today 3-m', 'today 12-m', 'today 5-y'
      ] as const;
      const timeframe =
        allowedTimeframes.includes(analysis.timeframe as typeof allowedTimeframes[number])
          ? (analysis.timeframe as typeof allowedTimeframes[number])
          : 'today 3-m';

      const trendsResponse = await TrendsService.searchTrends(analysis.keywords, {
        timeframe,
        geo: analysis.geo,
        include_ml: true,
        include_predictions: true
      });

      if (trendsResponse.success && trendsResponse.data) {
        const detailedData: DetailedTrendData[] = trendsResponse.data.trends.map((trend: TrendData) => ({
          ...trend,
          pattern_analysis: TrendsService.analyzeTrendPattern(trend),
          predictions: trendsResponse.data?.predictions?.find(p => p.keyword === trend.keyword)
        }));
        
        setTrendData(detailedData);
        processChartData(detailedData);
      }

      // Fetch insights
      const insightsResponse = await TrendsService.getTrendInsights(analysis.keywords, analysis.timeframe);
      if (insightsResponse.success && insightsResponse.data) {
        setInsights(insightsResponse.data);
      }

    } catch (err: any) {
      setError(err.message || 'Failed to fetch detailed analysis data');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (trends: DetailedTrendData[]) => {
    if (trends.length === 0) return;

    const processedData: any[] = [];
    const maxLength = Math.max(...trends.map(trend => trend.timestamps.length));

    for (let i = 0; i < maxLength; i++) {
      const dataPoint: any = {};
      
      trends.forEach(trend => {
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

  const calculateOverallStats = () => {
    const totalVolume = trendData.reduce((sum, trend) => 
      sum + trend.search_volume.reduce((tSum, val) => tSum + val, 0), 0
    );
    
    const avgVolume = totalVolume / trendData.length;
    const peakVolume = Math.max(...trendData.flatMap(trend => trend.search_volume));
    
    const peakTrend = trendData.find(trend => 
      trend.search_volume.includes(peakVolume)
    );
    
    const peakIndex = peakTrend ? peakTrend.search_volume.indexOf(peakVolume) : -1;
    const peakDate = peakTrend && peakIndex >= 0 ? peakTrend.timestamps[peakIndex] : null;

    return {
      totalVolume,
      avgVolume: Math.round(avgVolume),
      peakVolume,
      peakDate,
      peakKeyword: peakTrend?.keyword
    };
  };

  const exportAnalysis = () => {
    const stats = calculateOverallStats();
    
    const exportData = {
      analysis: {
        id: analysis.id,
        keywords: analysis.keywords,
        created_at: analysis.created_at,
        timeframe: analysis.timeframe,
        geo: analysis.geo
      },
      statistics: stats,
      trends: trendData.map(trend => ({
        keyword: trend.keyword,
        total_volume: trend.search_volume.reduce((sum, val) => sum + val, 0),
        peak_volume: Math.max(...trend.search_volume),
        pattern: trend.pattern_analysis
      })),
      insights: insights.slice(0, 10)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${analysis.id}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDetailedData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = calculateOverallStats();

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {analysis.keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {keyword}
                </span>
              ))}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {analysis.timeframe}
              </div>
              <div className="flex items-center">
                <Globe className="w-4 h-4 mr-1" />
                {analysis.geo}
              </div>
              <div className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {insights.length} insights
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={exportAnalysis}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
              <BookmarkPlus className="w-4 h-4 mr-2" />
              Save
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'trends', label: 'Trends', icon: TrendingUp },
              { id: 'predictions', label: 'Predictions', icon: TrendingUp },
              { id: 'insights', label: 'Insights', icon: Eye }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Total Volume</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.totalVolume.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Average Volume</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.avgVolume.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Peak Volume</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">
                    {stats.peakVolume.toLocaleString()}
                  </dd>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <dt className="text-sm font-medium text-gray-500">Peak Keyword</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900 truncate">
                    {stats.peakKeyword || 'N/A'}
                  </dd>
                </div>
              </div>

              {/* Overview Chart */}
              <div className="h-80">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Overview</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    {analysis.keywords.map((keyword, index) => (
                      <Area
                        key={keyword}
                        type="monotone"
                        dataKey={keyword}
                        stackId="1"
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        fill={`hsl(${index * 60}, 70%, 50%)`}
                        fillOpacity={0.3}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Quick Insights */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.slice(0, 4).map((insight, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          insight.type === 'spike' ? 'bg-green-100 text-green-800' :
                          insight.type === 'dip' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {insight.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Trends Tab */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    {analysis.keywords.map((keyword, index) => (
                      <Line
                        key={keyword}
                        type="monotone"
                        dataKey={keyword}
                        stroke={`hsl(${index * 60}, 70%, 50%)`}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {trendData.map((trend, index) => (
                  <div key={trend.keyword} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{trend.keyword}</h4>
                    {trend.pattern_analysis && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Pattern Type:</span>
                          <span className="font-medium">{trend.pattern_analysis.trend_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Growth Rate:</span>
                          <span className={`font-medium ${
                            trend.pattern_analysis.growth_rate > 0 ? 'text-green-600' : 
                            trend.pattern_analysis.growth_rate < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {trend.pattern_analysis.growth_rate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Volatility:</span>
                          <span className="font-medium">{(trend.pattern_analysis.volatility * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions Tab */}
          {activeTab === 'predictions' && (
            <MLPredictions
              keywords={analysis.keywords}
              timeframe={analysis.timeframe}
              geo={analysis.geo}
            />
          )}

          {/* Insights Tab */}
          {activeTab === 'insights' && (
            <TrendInsights insights={insights} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDetail;