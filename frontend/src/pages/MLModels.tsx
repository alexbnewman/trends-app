// src/pages/MLModels.tsx
import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { 
  Brain, 
  TrendingUp, 
  Activity, 
  Settings, 
  Play, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface ModelStatus {
  id: string;
  name: string;
  type: 'trend_prediction' | 'sentiment_analysis' | 'anomaly_detection' | 'pattern_recognition';
  status: 'active' | 'training' | 'error' | 'idle';
  accuracy?: number;
  last_trained: string;
  training_progress?: number;
  version: string;
  description: string;
}

interface TrainingMetrics {
  loss: number[];
  accuracy: number[];
  validation_loss: number[];
  validation_accuracy: number[];
  epochs: number;
}

const MLModels: React.FC = () => {
  const [models, setModels] = useState<ModelStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trainingModel, setTrainingModel] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelStatus | null>(null);
  const [trainingMetrics, setTrainingMetrics] = useState<TrainingMetrics | null>(null);

  useEffect(() => {
    fetchModels();
  }, []);

  const fetchModels = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getModelStatus();
      if (response.success) {
        setModels(response.data.models || []);
      } else {
        setError(response.error || 'Failed to fetch models');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch models');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainModel = async (modelId: string) => {
    try {
      setTrainingModel(modelId);
      const response = await ApiService.trainModels();
      
      if (response.success) {
        await fetchModels();
      } else {
        setError(response.error || 'Training failed');
      }
    } catch (err: any) {
      setError(err.message || 'Training failed');
    } finally {
      setTrainingModel(null);
    }
  };

  const getStatusIcon = (status: ModelStatus['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'training':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'idle':
        return <Clock className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getModelTypeIcon = (type: ModelStatus['type']) => {
    switch (type) {
      case 'trend_prediction':
        return <TrendingUp className="w-6 h-6" />;
      case 'sentiment_analysis':
        return <Brain className="w-6 h-6" />;
      case 'anomaly_detection':
        return <Activity className="w-6 h-6" />;
      case 'pattern_recognition':
        return <Settings className="w-6 h-6" />;
      default:
        return <Brain className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: ModelStatus['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'training':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'idle':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <Loading />;
  if (error) return <ErrorMessage message={error} onDismiss={fetchModels} />;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ML Models</h1>
          <p className="text-gray-600 mt-1">
            Manage and monitor your machine learning models
          </p>
        </div>
        <button
          onClick={fetchModels}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Models Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {models.map((model) => (
          <div key={model.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    {getModelTypeIcon(model.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {model.name}
                    </h3>
                    <p className="text-sm text-gray-500">v{model.version}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(model.status)}
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(model.status)}`}>
                    {model.status}
                  </span>
                </div>
              </div>

              <p className="mt-4 text-gray-600">{model.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Accuracy</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {model.accuracy ? `${(model.accuracy * 100).toFixed(1)}%` : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Trained</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(model.last_trained).toLocaleDateString()}
                  </dd>
                </div>
              </div>

              {model.training_progress !== undefined && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Training Progress</span>
                    <span>{model.training_progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${model.training_progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => handleTrainModel(model.id)}
                  disabled={model.status === 'training' || trainingModel === model.id}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {trainingModel === model.id ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {model.status === 'training' ? 'Training...' : 'Train Model'}
                </button>
                <button
                  onClick={() => setSelectedModel(model)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {models.length === 0 && (
        <div className="text-center py-12">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
          <p className="text-gray-500">Your ML models will appear here once they're configured.</p>
        </div>
      )}

      {/* Model Detail Modal */}
      {selectedModel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedModel.name}</h2>
                  <p className="text-gray-600 mt-1">{selectedModel.description}</p>
                </div>
                <button
                  onClick={() => setSelectedModel(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Model Information</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Type</dt>
                      <dd className="text-sm font-medium text-gray-900">{selectedModel.type.replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Version</dt>
                      <dd className="text-sm font-medium text-gray-900">v{selectedModel.version}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Status</dt>
                      <dd className={`text-sm font-medium ${getStatusColor(selectedModel.status)}`}>
                        {selectedModel.status}
                      </dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Performance</h3>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm text-gray-500">Accuracy</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {selectedModel.accuracy ? `${(selectedModel.accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500">Last Trained</dt>
                      <dd className="text-sm font-medium text-gray-900">
                        {new Date(selectedModel.last_trained).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {trainingMetrics && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Training Metrics</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Final Loss:</span>
                        <span className="ml-2 font-medium">{trainingMetrics.loss[trainingMetrics.loss.length - 1]?.toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Epochs:</span>
                        <span className="ml-2 font-medium">{trainingMetrics.epochs}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MLModels;
