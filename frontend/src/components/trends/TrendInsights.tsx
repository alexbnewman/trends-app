interface TrendInsight {
  title: string;
  description: string;
  // Add other fields if needed
}

interface TrendInsightsProps {
  insights: TrendInsight[];
}

const TrendInsights: React.FC<TrendInsightsProps> = ({ insights }) => {
  return (
    <div>
      <h2>Trend Insights</h2>
      {insights.map((insight, index) => (
        <div key={index}>
          <h3>{insight.title}</h3>
          <p>{insight.description}</p>
        </div>
      ))}
    </div>
  );
};

export default TrendInsights;