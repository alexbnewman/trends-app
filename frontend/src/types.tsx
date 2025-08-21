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