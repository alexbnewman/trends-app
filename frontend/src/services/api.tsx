import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';

const API_BASE_URL: string = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

interface TrendOptions {
  timeframe?: string;
  geo?: string;
}

interface Filters {
  [key: string]: string | number | boolean;
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth interceptor
    this.client.interceptors.request.use((config: AxiosRequestConfig) => {
      const token = localStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // Trends endpoints
  async searchTrends(keywords: string[], options: TrendOptions = {}): Promise<any> {
    const response = await this.client.post('/trends/search', {
      keywords,
      timeframe: options.timeframe || 'today 3-m',
      geo: options.geo || 'US',
    });
    return response.data;
  }

  async predictTrend(keyword: string): Promise<any> {
    const response = await this.client.post('/trends/predict', { keyword });
    return response.data;
  }

  async getInsights(keywords: string[], timeframe: string = 'today 3-m'): Promise<any> {
    const response = await this.client.post('/trends/insights', { keywords, timeframe });
    return response.data;
  }

  // Watchlists
  async getWatchlists(): Promise<any> {
    const response = await this.client.get('/watchlists');
    return response.data;
  }

  async analyzeWatchlist(watchlistId: number | string): Promise<any> {
    const response = await this.client.post(`/watchlists/${watchlistId}/analyze`);
    return response.data;
  }

  // Analysis
  async getAnalyses(filters: Filters = {}): Promise<any> {
    const params = new URLSearchParams(filters as Record<string, string>);
    const response = await this.client.get(`/analyses?${params}`);
    return response.data;
  }

  // Dashboard
  async getDashboardStats(): Promise<any> {
    const response = await this.client.get('/stats/dashboard');
    return response.data;
  }

  // ML Models
  async getModelStatus(): Promise<any> {
    const response = await this.client.get('/ml/models/status');
    return response.data;
  }

  async trainModels(): Promise<any> {
    const response = await this.client.post('/ml/models/train');
    return response.data;
  }
}

export default new ApiService();
