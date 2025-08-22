// src/pages/Analysis.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ApiService from '../services/api';
import AnalysisCard from '../components/analysis/AnalysisCard';
import AnalysisDetail from '../components/analysis/AnalysisDetail';
import TrendComparison from '../components/trends/TrendComparison';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { 
  Search, 
  Filter, 
  Calendar, 
  Globe, 
  Plus,
  BarChart3,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { type Analysis } from '../types';

const AnalysisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAnalysis, setShowNewAnalysis] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Form states
  const [newKeywords, setNewKeywords] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('today 3-m');
  const [selectedGeo, setSelectedGeo] = useState('US');
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const timeframes = [
    { value: 'now 1-H', label: 'Past hour' },
    { value: 'now 4-H', label: 'Past 4 hours' },
    { value: 'now 1-d', label: 'Past day' },
    { value: 'today 1-m', label: 'Past month' },
    { value: 'today 3-m', label: 'Past 3 months' },
    { value: 'today 12-m', label: 'Past 12 months' }
  ];

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' }
  ];

  useEffect(() => {
    fetchAnalyses();
    
    // Check if there's a specific analysis ID in URL params
    const analysisId = searchParams.get('id');
    if (analysisId) {
      const analysis = analyses.find(a => a.id.toString() === analysisId);
      if (analysis) {
        setSelectedAnalysis(analysis);
      }
    }
  }, [searchParams]);

  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      
      const filters: any = {};
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (dateFilter !== 'all') filters.date_filter = dateFilter;
      filters.sort_by = sortBy;
      filters.sort_order = sortOrder;
      
      const response = await ApiService.getAnalyses(filters);
      
      if (response.success) {
        setAnalyses(response.data.analyses || []);
      } else {
        setError(response.error || 'Failed to fetch analyses');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnalysis = async () => {
    if (!newKeywords.trim()) return;

    try {
      const keywords = newKeywords.split(',').map(k => k.trim()).filter(k => k);
      
      const response = await ApiService.searchTrends(keywords, {
        timeframe: selectedTimeframe,
        geo: selectedGeo
      });

      if (response.success) {
        // Refresh analyses list
        await fetchAnalyses();
        setShowNewAnalysis(false);
        setNewKeywords('');
      } else {
        setError(response.error || 'Failed to create analysis');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create analysis');
    }
  };

  const handleAnalysisSelect = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setSearchParams({ id: analysis.id.toString() });
  };

  const handleBackToList = () => {
    setSelectedAnalysis(null);
    setSearchParams({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (direction?: string) => {
    switch (direction) {
      case 'rising':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'falling':
        return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (selectedAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToList}
            className="flex items-center text-blue-600 hover:text-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Analyses
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analysis #{selectedAnalysis.id}
            </h1>
            <p className="text-gray-600">
              Created {new Date(selectedAnalysis.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <AnalysisDetail analysis={selectedAnalysis} />
        
        {selectedAnalysis.keywords.length > 1 && (
          <TrendComparison
            keywords={selectedAnalysis.keywords}
            timeframe={
              [
                "today 3-m",
                "now 1-H",
                "now 4-H",
                "now 1-d",
                "today 1-m",
                "today 12-m",
                "today 5-y"
              ].includes(selectedAnalysis.timeframe)
                ? (selectedAnalysis.timeframe as
                    | "today 3-m"
                    | "now 1-H"
                    | "now 4-H"
                    | "now 1-d"
                    | "today 1-m"
                    | "today 12-m"
                    | "today 5-y")
                : undefined
            }
            geo={selectedAnalysis.geo}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trend Analysis</h1>
          <p className="text-gray-600 mt-1">
            View and manage your trend analyses
          </p>
        </div>
        <button
          onClick={() => setShowNewAnalysis(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Analysis
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="created_at">Created Date</option>
              <option value="total_volume">Total Volume</option>
              <option value="insights_count">Insights Count</option>
            </select>
            
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          
          <button
            onClick={fetchAnalyses}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorMessage message={error} onDismiss={fetchAnalyses} />
      ) : analyses.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses found</h3>
          <p className="text-gray-500 mb-4">
            Start by creating your first trend analysis
          </p>
          <button
            onClick={() => setShowNewAnalysis(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Analysis
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {analyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              onClick={() => handleAnalysisSelect(analysis)}
            />
          ))}
        </div>
      )}

      {/* New Analysis Modal */}
      {showNewAnalysis && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Analysis</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords (comma-separated)
                  </label>
                  <textarea
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="e.g., artificial intelligence, machine learning, AI"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeframe
                  </label>
                  <select
                    value={selectedTimeframe}
                    onChange={(e) => setSelectedTimeframe(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {timeframes.map((tf) => (
                      <option key={tf.value} value={tf.value}>
                        {tf.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Region
                  </label>
                  <select
                    value={selectedGeo}
                    onChange={(e) => setSelectedGeo(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {regions.map((region) => (
                      <option key={region.code} value={region.code}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowNewAnalysis(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnalysis}
                  disabled={!newKeywords.trim()}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPage;