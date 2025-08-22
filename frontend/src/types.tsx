export interface Analytics {
  avg_interest?: number;
  max_interest?: number;
  trend_direction: 'rising' | 'falling' | 'stable';
  volatility?: number;
  predicted_category?: string;
}

interface TrendDataPoint {
  values: number[];
  analytics?: Analytics;
}

export interface TrendResults {
  [keyword: string]: TrendDataPoint;
}

export interface MLInsights {
  [keyword: string]: Analytics;
}

export interface WatchlistFormData {
  name: string;
  keywords: string[];
  status: 'active' | 'paused';
}

export interface Watchlist {
  id: number;
  name: string;
  keywords: string[];
  created_at: string;
  last_analyzed?: string;
  status: 'active' | 'paused';
  insights_count?: number;
}

export interface Analysis {
  id: number;
  keywords: string[];
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
  insights_count: number;
  timeframe: string;
  geo: string;
  total_volume?: number;
  peak_date?: string;
  trend_direction?: 'rising' | 'falling' | 'stable';
}