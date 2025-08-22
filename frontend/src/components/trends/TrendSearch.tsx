// src/components/trends/TrendSearch.tsx
import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface TrendSearchProps {
  onSearch: (keywords: string[], options: SearchOptions) => void;
  loading?: boolean;
  placeholder?: string;
}

interface SearchOptions {
  timeframe: string;
  geo: string;
  include_ml: boolean;
}

export const TrendSearch: React.FC<TrendSearchProps> = ({ 
  onSearch, 
  loading = false,
  placeholder = "Enter keywords separated by commas (e.g., python, javascript, react)"
}) => {
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    timeframe: 'today 3-m',
    geo: 'US',
    include_ml: true
  });
  const [keywords, setKeywords] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && keywords.length === 0) return;

    const searchKeywords = query.trim() 
      ? [...keywords, ...query.split(',').map(k => k.trim()).filter(k => k)]
      : keywords;

    const uniqueKeywords = Array.from(new Set(searchKeywords));
    onSearch(uniqueKeywords, options);
    setQuery('');
  };

  const addKeyword = (keyword: string) => {
    if (keyword && !keywords.includes(keyword)) {
      setKeywords([...keywords, keyword]);
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const timeframeOptions = [
    { value: 'now 1-H', label: 'Past hour' },
    { value: 'now 4-H', label: 'Past 4 hours' },
    { value: 'now 1-d', label: 'Past day' },
    { value: 'now 7-d', label: 'Past 7 days' },
    { value: 'today 1-m', label: 'Past 30 days' },
    { value: 'today 3-m', label: 'Past 3 months' },
    { value: 'today 12-m', label: 'Past year' },
    { value: 'today 5-y', label: 'Past 5 years' }
  ];

  const geoOptions = [
    { value: 'US', label: 'United States' },
    { value: '', label: 'Worldwide' },
    { value: 'GB', label: 'United Kingdom' },
    { value: 'CA', label: 'Canada' },
    { value: 'AU', label: 'Australia' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'IN', label: 'India' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Keywords Input */}
        <div>
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
            Search Keywords
          </label>
          <div className="relative">
            <input
              id="keywords"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
          </div>
          
          {/* Keywords Pills */}
          {keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(index)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Search Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="timeframe" className="block text-sm font-medium text-gray-700 mb-2">
              Time Range
            </label>
            <select
              id="timeframe"
              value={options.timeframe}
              onChange={(e) => setOptions({...options, timeframe: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeframeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="geo" className="block text-sm font-medium text-gray-700 mb-2">
              Region
            </label>
            <select
              id="geo"
              value={options.geo}
              onChange={(e) => setOptions({...options, geo: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {geoOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={options.include_ml}
                onChange={(e) => setOptions({...options, include_ml: e.target.checked})}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Include AI Insights</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || (!query.trim() && keywords.length === 0)}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Analyzing...' : 'Search Trends'}
        </button>
      </form>
    </div>
  );
};