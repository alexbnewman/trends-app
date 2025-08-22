// src/hooks/useTrends.ts
import { useState, useCallback } from 'react';
import ApiService from '../services/api';

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

interface TrendOptions {
  timeframe?: string;
  geo?: string;
  include_ml?: boolean;
}

export const useTrends = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendData>({});

  const searchTrends = useCallback(async (keywords: string[], options: TrendOptions = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.searchTrends(keywords, options);
      if (response.success) {
        setTrends(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch trends');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch trends';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const predictTrend = useCallback(async (keyword: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.predictTrend(keyword);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Prediction failed');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Prediction failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getInsights = useCallback(async (keywords: string[], timeframe: string = 'today 3-m') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getInsights(keywords, timeframe);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get insights');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get insights';
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
    trends,
    loading,
    error,
    searchTrends,
    predictTrend,
    getInsights,
    clearError,
  };
};