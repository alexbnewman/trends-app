// src/components/watchlists/WatchlistCard.tsx
import React, { useState } from 'react';
import { 
  EyeIcon, 
  ChartBarIcon, 
  CalendarIcon,
  TrashIcon,
  PencilIcon 
} from '@heroicons/react/24/outline';
import { type Watchlist } from '../../types';


interface WatchlistCardProps {
  watchlist: Watchlist;
  onAnalyze: (id: number) => void;
  onEdit?: (watchlist: Watchlist) => void;
  onDelete?: (id: number) => void;
}

const WatchlistCard: React.FC<WatchlistCardProps> = ({ 
  watchlist, 
  onAnalyze, 
  onEdit, 
  onDelete 
}) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      await onAnalyze(watchlist.id);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'text-green-700 bg-green-50 border-green-200' 
      : 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {watchlist.name}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(watchlist.status)}`}>
              {watchlist.status}
            </span>
            {onEdit && (
              <button
                onClick={() => onEdit(watchlist)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Edit watchlist"
              >
                <PencilIcon className="h-4 w-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(watchlist.id)}
                className="p-1 text-gray-400 hover:text-red-600"
                title="Delete watchlist"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Keywords */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Keywords ({watchlist.keywords.length})</p>
          <div className="flex flex-wrap gap-1">
            {watchlist.keywords.slice(0, 4).map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
              >
                {keyword}
              </span>
            ))}
            {watchlist.keywords.length > 4 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{watchlist.keywords.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Created</p>
              <p className="font-medium text-gray-900">{formatDate(watchlist.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-gray-600">Insights</p>
              <p className="font-medium text-gray-900">{watchlist.insights_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Last Analyzed */}
        {watchlist.last_analyzed && (
          <div className="mb-4 text-sm">
            <p className="text-gray-600">
              Last analyzed: <span className="font-medium text-gray-900">
                {formatDate(watchlist.last_analyzed)}
              </span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analyzing...' : 'Analyze Now'}
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default WatchlistCard;