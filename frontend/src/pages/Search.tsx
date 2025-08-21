// src/pages/Search.tsx
import React, { useState, type FormEvent } from 'react';
import { useTrends } from '../hooks/useTrends';
import TrendChart from '../components/trends/TrendChart';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { type TrendResults, type MLInsights, type Analytics } from '../types';

const Search: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<TrendResults | null>(null);
  const [mlInsights, setMlInsights] = useState<MLInsights>({});
  const { loading, error, searchTrends } = useTrends();

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const keywords = query.split(',').map((k) => k.trim()).filter(Boolean);
      const trendData = await searchTrends(keywords, {
        timeframe: 'today 3-m',
        include_ml: true,
      });

      if (!trendData) return;

      setResults(trendData);

      // Extract ML insights and ensure trend_direction and volatility are always defined
      const insights: MLInsights = {};
      Object.entries(trendData).forEach(([keyword, data]) => {
        if (data.analytics) {
          insights[keyword] = {
            ...data.analytics,
            trend_direction: data.analytics.trend_direction ?? 'stable',
            volatility: typeof data.analytics.volatility === 'number' ? data.analytics.volatility : 0,
          } as Analytics;
        }
      });
      setMlInsights(insights);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Trend Search</h1>
        <p className="text-lg text-gray-600">
          Search and analyze trending topics with AI-powered insights
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter keywords separated by commas (e.g., python, javascript, react)"
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <TrendChart
            data={results}
            keywords={Object.keys(results)}
            insights={mlInsights}
          />

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Keyword Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(results).map(([keyword, data]) => (
                <div key={keyword} className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">{keyword}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Interest:</span>
                      <span className="font-medium">{data.analytics?.avg_interest?.toFixed(1) ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Interest:</span>
                      <span className="font-medium">{data.analytics?.max_interest?.toFixed(1) ?? 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend:</span>
                      <span
                        className={`font-medium ${
                          data.analytics?.trend_direction === 'rising'
                            ? 'text-green-600'
                            : data.analytics?.trend_direction === 'falling'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {data.analytics?.trend_direction ?? 'stable'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
