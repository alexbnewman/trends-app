// src/hooks/useWatchlists.ts
import { useState, useCallback } from 'react';
import ApiService from '../services/api';

interface Watchlist {
  id: number;
  name: string;
  keywords: string[];
  created_at: string;
  last_analyzed?: string;
  status: 'active' | 'paused';
  insights_count?: number;
}

interface WatchlistFormData {
  name: string;
  keywords: string[];
  status: 'active' | 'paused';
}

export const useWatchlists = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWatchlists = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getWatchlists();
      if (response.success) {
        setWatchlists(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch watchlists');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch watchlists';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWatchlist = useCallback(async (data: WatchlistFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // Note: This endpoint would need to be added to your ApiService
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/watchlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setWatchlists(prev => [...prev, result.data]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to create watchlist');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create watchlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateWatchlist = useCallback(async (id: number, data: WatchlistFormData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/watchlists/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setWatchlists(prev => prev.map(w => w.id === id ? { ...w, ...result.data } : w));
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update watchlist');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update watchlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWatchlist = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'}/watchlists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setWatchlists(prev => prev.filter(w => w.id !== id));
        return true;
      } else {
        throw new Error(result.error || 'Failed to delete watchlist');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete watchlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const analyzeWatchlist = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.analyzeWatchlist(id);
      if (response.success) {
        // Update the watchlist's last_analyzed timestamp
        setWatchlists(prev => prev.map(w => 
          w.id === id ? { ...w, last_analyzed: new Date().toISOString() } : w
        ));
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to analyze watchlist');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to analyze watchlist';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    watchlists,
    loading,
    error,
    fetchWatchlists,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    analyzeWatchlist,
    clearError,
  };
};
