// src/components/trends/TrendChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Insight {
  trend_direction: 'rising' | 'falling' | 'stable';
  volatility: number;
  predicted_category?: string;
}

interface TrendDataPoint {
  values: number[];
}

interface TrendData {
  [keyword: string]: TrendDataPoint;
}

interface ChartProps {
  data: TrendData;
  keywords: string[];
  insights?: Record<string, Insight>;
}

const TrendChart: React.FC<ChartProps> = ({ data, keywords, insights = {} }) => {
  // Transform data for Recharts
  const chartData =
    data[Object.keys(data)[0]]?.values?.map((_, index) => {
      const point: Record<string, number> = { index };
      Object.keys(data).forEach((keyword) => {
        point[keyword] = data[keyword].values[index];
      });
      return point;
    }) || [];

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trend Analysis</h3>
        <p className="text-sm text-gray-600">Interest over time comparison</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />
          <Legend />
          {keywords.map((keyword, index) => (
            <Line
              key={keyword}
              type="monotone"
              dataKey={keyword}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* ML Insights */}
      {Object.keys(insights).length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(insights).map(([keyword, insight]) => (
            <div key={keyword} className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">{keyword}</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Direction:</span>
                  <span
                    className={`font-medium ${
                      insight.trend_direction === 'rising'
                        ? 'text-green-600'
                        : insight.trend_direction === 'falling'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`}
                  >
                    {insight.trend_direction}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Volatility:</span>
                  <span>{(insight.volatility * 100).toFixed(1)}%</span>
                </div>
                {insight.predicted_category && (
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium text-blue-600">
                      {insight.predicted_category}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendChart;