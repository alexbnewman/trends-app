// src/hooks/useAnalytics.ts
import { useState, useCallback } from 'react';
import ApiService from '../services/api';

interface AnalyticsData {
  dashboard_stats: any;
  model_status: any;
  recent_activity: any[];
}

interface Filters {
  [key: string]: string | number | boolean;
}

export const useAnalytics = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getDashboardStats();
      if (response.success) {
        setData(response.data);
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch dashboard stats');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch dashboard stats';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAnalyses = useCallback(async (filters: Filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getAnalyses(filters);
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch analyses');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch analyses';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getModelStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.getModelStatus();
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to get model status');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to get model status';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const trainModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await ApiService.trainModels();
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to start model training');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to start model training';
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
    data,
    loading,
    error,
    fetchDashboardStats,
    fetchAnalyses,
    getModelStatus,
    trainModels,
    clearError,
  };
};