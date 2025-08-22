// src/pages/Search.tsx
import React, { useState } from 'react';
import { useTrends } from '../hooks/useTrends';
import { TrendChart } from '../components/trends/TrendChart';
import { TrendSearch } from '../components/trends/TrendSearch';
import ApiService from '../services/api';

interface SearchResults {
  trends: any;
  insights: any;
  keywords: string[];
}

const Search: React.FC = () => {
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { loading, error } = useTrends();

  const handleSearch = async (keywords: string[], options: any) => {
    try {
      // Use the API service directly to get both trends and insights
      const trendResponse = await ApiService.searchTrends(keywords, options);
      
      if (trendResponse.success) {
        const searchResults = {
          trends: trendResponse.data,
          insights: {},
          keywords
        };

        // If ML insights are requested, extract them
        if (options.include_ml) {
          const insights: any = {};
          Object.entries(trendResponse.data).forEach(([keyword, data]: [string, any]) => {
            if (data.analytics) {
              insights[keyword] = data.analytics;
            }
          });
          searchResults.insights = insights;
        }

        setResults(searchResults);
        
        // Update search history
        const searchQuery = keywords.join(', ');
        setSearchHistory(prev => [searchQuery, ...prev.slice(0, 4)]);
      }
    } catch (err: any) {
      console.error('Search failed:', err);
    }
  };

  const clearResults = () => {
    setResults(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Trend Search</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Search and analyze trending topics with AI-powered insights. 
          Compare multiple keywords and discover patterns in real-time data.
        </p>
      </div>

      {/* Search Form */}
      <TrendSearch 
        onSearch={handleSearch}
        loading={loading}
      />

      {/* Search History */}
      {searchHistory.length > 0 && !results && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  const keywords = search.split(', ');
                  handleSearch(keywords, { timeframe: 'today 3-m', geo: 'US', include_ml: true });
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-8">
          {/* Action Bar */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Analysis Results for: {results.keywords.join(', ')}
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={clearResults}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                New Search
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save to Watchlist
              </button>
            </div>
          </div>

          {/* Trend Chart */}
          <TrendChart 
            data={results.trends} 
            keywords={results.keywords}
            insights={results.insights}
          />
          
          {/* Keyword Summary */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Keyword Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(results.trends).map(([keyword, data]: [string, any]) => (
                <div key={keyword} className="border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-4">{keyword}</h4>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Interest:</span>
                      <span className="font-medium">
                        {data.analytics?.avg_interest?.toFixed(1) || 'N/A'}
                        {data.analytics?.avg_interest && '%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Interest:</span>
                      <span className="font-medium">
                        {data.analytics?.max_interest?.toFixed(1) || 'N/A'}
                        {data.analytics?.max_interest && '%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trend:</span>
                      <span className={`font-medium ${
                        data.analytics?.trend_direction === 'rising' ? 'text-green-600' :
                        data.analytics?.trend_direction === 'falling' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {data.analytics?.trend_direction || 'stable'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Volatility:</span>
                      <span className="font-medium">
                        {data.analytics?.volatility ? (data.analytics.volatility * 100).toFixed(1) + '%' : 'N/A'}
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