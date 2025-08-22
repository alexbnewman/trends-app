// src/components/dashboard/RecentActivity.tsx
import React from 'react';
import { ClockIcon, ChartBarIcon } from '@heroicons/react/24/outline';

interface Analysis {
  id: number;
  keywords: string[];
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  insights_count?: number;
}

interface RecentActivityProps {
  analyses: Analysis[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ analyses }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <ClockIcon className="h-5 w-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {analyses.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No recent activity</p>
        ) : (
          analyses.slice(0, 5).map((analysis) => (
            <div key={analysis.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-5 w-5 text-gray-400 mt-1" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {analysis.keywords.join(', ')}
                  </p>
                  <div className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(analysis.status)}`}>
                    {analysis.status}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-500">
                    {formatDate(analysis.created_at)}
                  </p>
                  {analysis.insights_count && (
                    <p className="text-xs text-gray-400">
                      {analysis.insights_count} insights
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {analyses.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentActivity;