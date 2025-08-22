// src/services/trends.tsx
import ApiService from './api';

export interface TrendData {
  keyword: string;
  search_volume: number[];
  timestamps: string[];
  geo: string;
  timeframe: string;
}

export interface TrendPrediction {
  keyword: string;
  predicted_values: number[];
  confidence_interval: {
    lower: number[];
    upper: number[];
  };
  trend_direction: 'rising' | 'falling' | 'stable';
  peak_probability: number;
  next_7_days: number[];
  accuracy_score?: number;
}

export interface TrendInsight {
  id: string;
  type: 'spike' | 'dip' | 'seasonal' | 'correlation' | 'anomaly';
  title: string;
  description: string;
  keywords: string[];
  confidence: number;
  impact_score: number;
  timeframe: string;
  created_at: string;
}

export interface ComparisonResult {
  keywords: string[];
  data: TrendData[];
  correlation_matrix?: number[][];
  insights: TrendInsight[];
  best_performing: {
    keyword: string;
    metric: string;
    value: number;
  };
}

export interface TrendOptions {
  timeframe?: 'now 1-H' | 'now 4-H' | 'now 1-d' | 'today 1-m' | 'today 3-m' | 'today 12-m' | 'today 5-y';
  geo?: string;
  category?: string;
  include_ml?: boolean;
  include_predictions?: boolean;
  comparison?: boolean;
}

class TrendsService {
  // Search for trends
  async searchTrends(keywords: string[], options: TrendOptions = {}): Promise<{
    success: boolean;
    data?: {
      trends: TrendData[];
      predictions?: TrendPrediction[];
      insights?: TrendInsight[];
    };
    error?: string;
  }> {
    try {
      const response = await ApiService.searchTrends(keywords, {
        timeframe: options.timeframe || 'today 3-m',
        geo: options.geo || 'US',
        ...options
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to search trends'
      };
    }
  }

  // Compare multiple keywords
  async compareTrends(keywords: string[], options: TrendOptions = {}): Promise<{
    success: boolean;
    data?: ComparisonResult;
    error?: string;
  }> {
    try {
      const response = await ApiService.searchTrends(keywords, {
        ...options
      });
      
      if (response.success && response.data) {
        const comparisonResult: ComparisonResult = {
          keywords,
          data: response.data.trends || [],
          correlation_matrix: response.data.correlation_matrix,
          insights: response.data.insights || [],
          best_performing: this.findBestPerforming(response.data.trends || [])
        };
        
        return {
          success: true,
          data: comparisonResult
        };
      }
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to compare trends'
      };
    }
  }

  // Get trend predictions
  async getTrendPredictions(keyword: string): Promise<{
    success: boolean;
    data?: TrendPrediction;
    error?: string;
  }> {
    try {
      const response = await ApiService.predictTrend(keyword);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get trend predictions'
      };
    }
  }

  // Get insights for keywords
  async getTrendInsights(keywords: string[], timeframe: string = 'today 3-m'): Promise<{
    success: boolean;
    data?: TrendInsight[];
    error?: string;
  }> {
    try {
      const response = await ApiService.getInsights(keywords, timeframe);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get trend insights'
      };
    }
  }

  // Analyze trend patterns
  analyzeTrendPattern(data: TrendData): {
    trend_type: 'exponential' | 'linear' | 'seasonal' | 'volatile' | 'stable';
    growth_rate: number;
    volatility: number;
    seasonal_strength?: number;
  } {
    const values = data.search_volume;
    if (values.length < 2) {
      return { trend_type: 'stable', growth_rate: 0, volatility: 0 };
    }

    // Calculate growth rate
    const firstValue = values[0] || 0;
    const lastValue = values[values.length - 1] || 0;
    const growthRate = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    // Calculate volatility (coefficient of variation)
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const volatility = mean !== 0 ? Math.sqrt(variance) / mean : 0;

    // Determine trend type
    let trendType: 'exponential' | 'linear' | 'seasonal' | 'volatile' | 'stable' = 'stable';
    
    if (volatility > 0.5) {
      trendType = 'volatile';
    } else if (Math.abs(growthRate) > 50) {
      trendType = 'exponential';
    } else if (Math.abs(growthRate) > 10) {
      trendType = 'linear';
    } else if (this.detectSeasonality(values)) {
      trendType = 'seasonal';
    }

    return {
      trend_type: trendType,
      growth_rate: growthRate,
      volatility: volatility,
      seasonal_strength: trendType === 'seasonal' ? this.calculateSeasonalStrength(values) : undefined
    };
  }

  // Helper method to find best performing keyword
  private findBestPerforming(trends: TrendData[]): {
    keyword: string;
    metric: string;
    value: number;
  } {
    if (trends.length === 0) {
      return { keyword: '', metric: 'volume', value: 0 };
    }

    let bestKeyword = trends[0].keyword;
    let maxVolume = 0;

    trends.forEach(trend => {
      const totalVolume = trend.search_volume.reduce((sum, val) => sum + val, 0);
      if (totalVolume > maxVolume) {
        maxVolume = totalVolume;
        bestKeyword = trend.keyword;
      }
    });

    return {
      keyword: bestKeyword,
      metric: 'total_volume',
      value: maxVolume
    };
  }

  // Helper method to detect seasonality
  private detectSeasonality(values: number[]): boolean {
    if (values.length < 12) return false;
    
    // Simple seasonality detection using autocorrelation
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    if (variance === 0) return false;

    // Check for weekly or monthly patterns
    const periods = [7, 30]; // weekly, monthly
    let maxCorrelation = 0;

    periods.forEach(period => {
      if (values.length >= period * 2) {
        let correlation = 0;
        for (let i = 0; i < values.length - period; i++) {
          correlation += (values[i] - mean) * (values[i + period] - mean);
        }
        correlation = Math.abs(correlation / ((values.length - period) * variance));
        maxCorrelation = Math.max(maxCorrelation, correlation);
      }
    });

    return maxCorrelation > 0.3; // Threshold for seasonality
  }

  // Helper method to calculate seasonal strength
  private calculateSeasonalStrength(values: number[]): number {
    // Simplified seasonal strength calculation
    if (values.length < 12) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const deviations = values.map(val => Math.abs(val - mean));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    
    return mean !== 0 ? Math.min(avgDeviation / mean, 1) : 0;
  }

  // Get available geographic regions
  getAvailableRegions(): { code: string; name: string }[] {
    return [
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'CA', name: 'Canada' },
      { code: 'AU', name: 'Australia' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'JP', name: 'Japan' },
      { code: 'IN', name: 'India' },
      { code: 'BR', name: 'Brazil' },
      { code: 'MX', name: 'Mexico' }
    ];
  }

  // Get available timeframes
  getAvailableTimeframes(): { value: string; label: string }[] {
    return [
      { value: 'now 1-H', label: 'Past hour' },
      { value: 'now 4-H', label: 'Past 4 hours' },
      { value: 'now 1-d', label: 'Past day' },
      { value: 'today 1-m', label: 'Past month' },
      { value: 'today 3-m', label: 'Past 3 months' },
      { value: 'today 12-m', label: 'Past 12 months' },
      { value: 'today 5-y', label: 'Past 5 years' }
    ];
  }
}

export default new TrendsService();