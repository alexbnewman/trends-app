// src/components/dashboard/QuickAnalysis.tsx
import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface QuickAnalysisProps {
  onAnalyze: (keywords: string) => void;
}

const QuickAnalysis: React.FC<QuickAnalysisProps> = ({ onAnalyze }) => {
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywords.trim()) return;

    setLoading(true);
    try {
      await onAnalyze(keywords);
    } finally {
      setLoading(false);
      setKeywords('');
    }
  };

  const popularTrends = [
    'artificial intelligence',
    'cryptocurrency',
    'climate change',
    'remote work',
    'electric vehicles'
  ];

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Analysis</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="keywords" className="sr-only">
            Keywords
          </label>
          <div className="relative">
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Enter keywords separated by commas"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !keywords.trim()}
              className="absolute right-2 top-2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <MagnifyingGlassIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading || !keywords.trim()}
          className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Analyzing...' : 'Analyze Trends'}
        </button>
      </form>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Popular Trends</h4>
        <div className="flex flex-wrap gap-2">
          {popularTrends.map((trend) => (
            <button
              key={trend}
              onClick={() => setKeywords(trend)}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              {trend}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickAnalysis;