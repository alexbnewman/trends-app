// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useTrends } from '../hooks/useTrends';
import ApiService from '../services/api';
import DashboardStats from '../components/dashboard/DashboardStats';
import QuickAnalysis from '../components/dashboard/QuickAnalysis';
import RecentActivity from '../components/dashboard/RecentActivity';

interface DashboardData {
  counts: {
    total_analyses: number;
    active_watchlists: number;
    trends_tracked: number;
    predictions_generated: number;
  };
  ml_status: {
    model_status: 'active' | 'training' | 'error';
    last_updated: string;
    accuracy?: number;
  };
  recent_analyses: Array<{
    id: number;
    keywords: string[];
    created_at: string;
    status: 'completed' | 'pending' | 'failed';
    insights_count?: number;
  }>;
}

const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { searchTrends } = useTrends();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getDashboardStats();
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError(response.error || 'Failed to load dashboard data');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAnalysis = async (keywords: string) => {
    try {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
      const results = await searchTrends(keywordArray, {
        timeframe: 'today 3-m',
        include_ml: true
      });
      
      // You could navigate to a results page or show results in a modal
      console.log('Quick analysis results:', results);
      
      // Refresh dashboard data to show the new analysis
      fetchDashboardData();
    } catch (error: any) {
      console.error('Quick analysis failed:', error);
      setError('Quick analysis failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's your trend analysis overview.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {dashboardData && (
        <>
          {/* Stats Cards */}
          <DashboardStats 
            stats={dashboardData.counts} 
            mlStatus={dashboardData.ml_status} 
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuickAnalysis onAnalyze={handleQuickAnalysis} />
            <RecentActivity analyses={dashboardData.recent_analyses} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;