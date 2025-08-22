// src/pages/Watchlists.tsx
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import WatchlistCard from '../components/watchlists/WatchlistCard';
import WatchlistForm from '../components/watchlists/WatchlistForm';
import WatchlistAnalysis from '../components/watchlists/WatchlistAnalysis';
import { PlusIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { type WatchlistFormData } from '../types';

interface Watchlist {
  id: number;
  name: string;
  keywords: string[];
  created_at: string;
  last_analyzed?: string;
  status: 'active' | 'paused';
  insights_count?: number;
}

const Watchlists: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<Watchlist | null>(null);
  const [analyzingWatchlist, setAnalyzingWatchlist] = useState<number | null>(null);
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused'>('all');

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiService.getWatchlists();
      if (response.success) {
        setWatchlists(response.data);
      } else {
        setError(response.error || 'Failed to fetch watchlists');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch watchlists');
      console.error('Watchlists fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWatchlist = async (formData: WatchlistFormData) => {
    try {
      // This would need to be implemented in your API service
      const response = await ApiService.createWatchlist?.(formData);
      if (response?.success) {
        await fetchWatchlists();
        setShowCreateForm(false);
      }
    } catch (error: any) {
      console.error('Failed to create watchlist:', error);
      setError('Failed to create watchlist');
    }
  };

  const handleUpdateWatchlist = async (formData: WatchlistFormData) => {
    if (!editingWatchlist) return;
    
    try {
      // This would need to be implemented in your API service
      const response = await ApiService.updateWatchlist?.(editingWatchlist.id, formData);
      if (response?.success) {
        await fetchWatchlists();
        setEditingWatchlist(null);
      }
    } catch (error: any) {
      console.error('Failed to update watchlist:', error);
      setError('Failed to update watchlist');
    }
  };

  const handleDeleteWatchlist = async (watchlistId: number) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;
    
    try {
      // This would need to be implemented in your API service
      const response = await ApiService.deleteWatchlist?.(watchlistId);
      if (response?.success) {
        await fetchWatchlists();
      }
    } catch (error: any) {
      console.error('Failed to delete watchlist:', error);
      setError('Failed to delete watchlist');
    }
  };

  const handleAnalyzeWatchlist = async (watchlistId: number) => {
    try {
      setAnalyzingWatchlist(watchlistId);
      const response = await ApiService.analyzeWatchlist(watchlistId);
      if (response.success) {
        setAnalysisData(response.data);
        await fetchWatchlists(); // Refresh to update last_analyzed dates
      } else {
        setError(response.error || 'Analysis failed');
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setError('Analysis failed. Please try again.');
    } finally {
      setAnalyzingWatchlist(null);
    }
  };

  const filteredWatchlists = watchlists.filter(watchlist => {
    if (filter === 'all') return true;
    return watchlist.status === filter;
  });

  const filterCounts = {
    all: watchlists.length,
    active: watchlists.filter(w => w.status === 'active').length,
    paused: watchlists.filter(w => w.status === 'paused').length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show analysis results
  if (analysisData) {
    const watchlist = watchlists.find(w => w.id === analyzingWatchlist);
    if (watchlist) {
      return (
        <WatchlistAnalysis
          watchlist={watchlist}
          analysisData={analysisData}
          onClose={() => setAnalysisData(null)}
        />
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Watchlists</h1>
          <p className="text-gray-600 mt-1">
            Track and analyze your favorite keywords and trends
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Watchlist
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 bg-white rounded-lg shadow p-1">
          {(['all', 'active', 'paused'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-2 text-xs opacity-75">
                ({filterCounts[status]})
              </span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <FunnelIcon className="h-4 w-4" />
          <span>
            Showing {filteredWatchlists.length} of {watchlists.length} watchlists
          </span>
        </div>
      </div>

      {/* Watchlists Grid */}
      {filteredWatchlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <FunnelIcon className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {watchlists.length === 0 ? 'No watchlists yet' : 'No watchlists match your filter'}
          </h3>
          <p className="text-gray-500 mb-6">
            {watchlists.length === 0 
              ? 'Create your first watchlist to start tracking trends'
              : 'Try adjusting your filter or create a new watchlist'
            }
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Your First Watchlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWatchlists.map(watchlist => (
            <WatchlistCard
              key={watchlist.id}
              watchlist={watchlist}
              onAnalyze={() => handleAnalyzeWatchlist(watchlist.id)}
              onEdit={() => setEditingWatchlist(watchlist)}
              onDelete={() => handleDeleteWatchlist(watchlist.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form Modal */}
      {(showCreateForm || editingWatchlist) && (
        <WatchlistForm
          watchlist={editingWatchlist}
          onSubmit={editingWatchlist ? handleUpdateWatchlist : handleCreateWatchlist}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingWatchlist(null);
          }}
        />
      )}
    </div>
  );
};

export default Watchlists;