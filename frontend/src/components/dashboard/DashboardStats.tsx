// src/components/dashboard/DashboardStats.tsx
import React from 'react';
import { 
  ChartBarIcon, 
  EyeIcon, 
  CpuChipIcon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface Stats {
  total_analyses: number;
  active_watchlists: number;
  trends_tracked: number;
  predictions_generated: number;
}

interface MLStatus {
  model_status: 'active' | 'training' | 'error';
  last_updated: string;
  accuracy?: number;
}

interface DashboardStatsProps {
  stats: Stats;
  mlStatus: MLStatus;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, mlStatus }) => {
  const statItems = [
    {
      name: 'Total Analyses',
      value: stats.total_analyses,
      icon: ChartBarIcon,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      name: 'Active Watchlists',
      value: stats.active_watchlists,
      icon: EyeIcon,
      color: 'text-green-600 bg-green-100',
    },
    {
      name: 'Trends Tracked',
      value: stats.trends_tracked,
      icon: DocumentTextIcon,
      color: 'text-purple-600 bg-purple-100',
    },
    {
      name: 'Predictions Made',
      value: stats.predictions_generated,
      icon: CpuChipIcon,
      color: 'text-orange-600 bg-orange-100',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'training': return 'text-yellow-600 bg-yellow-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item) => (
        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${item.color}`}>
                  <item.icon className="h-6 w-6" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {item.value.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
      {/* ML Status Card */}
      <div className="bg-white overflow-hidden shadow rounded-lg lg:col-span-4 mt-6">
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-3 rounded-md ${getStatusColor(mlStatus.model_status)}`}>
                <CpuChipIcon className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">ML Model Status</h3>
                <p className="text-sm text-gray-500">
                  Status: <span className="capitalize font-medium">{mlStatus.model_status}</span>
                  {mlStatus.accuracy && (
                    <> • Accuracy: {(mlStatus.accuracy * 100).toFixed(1)}%</>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="text-sm font-medium text-gray-900">
                {new Date(mlStatus.last_updated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;