// src/components/watchlists/WatchlistForm.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { type WatchlistFormData, type Watchlist } from '../../types';

interface WatchlistFormProps {
  watchlist?: Watchlist | null;
  onSubmit: (data: WatchlistFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const WatchlistForm: React.FC<WatchlistFormProps> = ({
  watchlist,
  onSubmit,
  onCancel,
  loading = false
}) => {
  const [formData, setFormData] = useState<WatchlistFormData>({
    name: '',
    keywords: [],
    status: 'active'
  });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (watchlist) {
      setFormData({
        name: watchlist.name,
        keywords: watchlist.keywords,
        status: watchlist.status
      });
    }
  }, [watchlist]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.keywords.length === 0) return;
    onSubmit(formData);
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...formData.keywords, keyword]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (index: number) => {
    setFormData({
      ...formData,
      keywords: formData.keywords.filter((_, i) => i !== index)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              {watchlist ? 'Edit Watchlist' : 'Create New Watchlist'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Watchlist Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g., Tech Trends, Market Analysis"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Keywords ({formData.keywords.length})
              </label>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a keyword"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  disabled={!keywordInput.trim()}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Keywords List */}
              {formData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.keywords.map((keyword, index) => (
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
              
              {formData.keywords.length === 0 && (
                <p className="text-sm text-gray-500">Add at least one keyword to track</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'paused'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || formData.keywords.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : watchlist ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WatchlistForm;