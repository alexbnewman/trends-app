// src/pages/Watchlists.tsx
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import WatchlistCard from '../components/watchlists/WatchlistCard';
import { PlusIcon } from '@heroicons/react/24/outline';

interface Watchlist {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  // Add other fields if needed
}

const Watchlists: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchWatchlists();
  }, []);

  const fetchWatchlists = async () => {
    try {
      const response = await ApiService.getWatchlists();
      if (response.success) {
        setWatchlists(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch watchlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeWatchlist = async (watchlistId: string) => {
    try {
      const response = await ApiService.analyzeWatchlist(watchlistId);
      if (response.success) {
        console.log('Analysis complete:', response.data);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading watchlists...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Watchlists</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Watchlist
        </button>
      </div>

      {watchlists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No watchlists created yet.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Create Your First Watchlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlists.map((watchlist) => (
            <WatchlistCard
              key={watchlist.id}
              watchlist={watchlist}
              onAnalyze={() => handleAnalyzeWatchlist(watchlist.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlists;