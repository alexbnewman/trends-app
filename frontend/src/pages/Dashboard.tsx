// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useTrends } from '../hooks/useTrends';
import ApiService from '../services/api';
import DashboardStats from '../components/dashboard/DashboardStats';
import QuickAnalysis from '../components/dashboard/QuickAnalysis';
import RecentActivity from '../components/dashboard/RecentActivity';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { searchTrends } = useTrends();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await ApiService.getDashboardStats();
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickAnalysis = async (keywords) => {
    try {
      const results = await searchTrends(keywords.split(','));
      // Navigate to analysis results or update state
      console.log('Quick analysis results:', results);
    } catch (error) {
      console.error('Quick analysis failed:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Welcome back! Here's your trend analysis overview.
        </div>
      </div>

      {dashboardData && (
        <>
          <DashboardStats stats={dashboardData.counts} mlStatus={dashboardData.ml_status} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <QuickAnalysis onAnalyze={handleQuickAnalysis} />
            <RecentActivity analyses={dashboardData.recent_analyses} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;