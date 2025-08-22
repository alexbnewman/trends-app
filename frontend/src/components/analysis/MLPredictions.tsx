interface MLPredictionsProps {
  keywords: string[];
  timeframe: string;
  geo: string;
}

const MLPredictions: React.FC<MLPredictionsProps> = ({ keywords, timeframe, geo }) => {
  return <div>ML Predictions{JSON.stringify({ keywords, timeframe, geo })}</div>;
};

export default MLPredictions;