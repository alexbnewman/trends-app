// src/hooks/useTrends.ts
import { useState, useCallback } from 'react';
import ApiService from '../services/api';

interface TrendOptions {
  timeframe?: string;
  include_ml?: boolean;
  geo?: string;
}

interface TrendsData {
  [keyword: string]: any; // You can replace `any` with a stricter type if you know the shape
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const useTrends = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<TrendsData>({});

  const searchTrends = useCallback(
    async (keywords: string[], options: TrendOptions = {}): Promise<TrendsData | undefined> => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<TrendsData> = await ApiService.searchTrends(keywords, options);
        if (response.success) {
          setTrends(response.data);
          return response.data;
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to fetch trends');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const predictTrend = useCallback(
    async (keyword: string): Promise<any> => {
      setLoading(true);
      setError(null);

      try {
        const response: ApiResponse<any> = await ApiService.predictTrend(keyword);
        if (response.success) {
          return response.data;
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Prediction failed');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    trends,
    loading,
    error,
    searchTrends,
    predictTrend,
  };
};
