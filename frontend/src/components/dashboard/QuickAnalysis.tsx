type QuickAnalysisProps = {
  onAnalyze: (keywords: string) => void;
};

const QuickAnalysis: React.FC<QuickAnalysisProps> = ({ onAnalyze }) => {
  return (
    <div>
      <h2 className="text-xl font-bold">Quick Analysis</h2>
      <button onClick={() => onAnalyze('example,keywords')}>Analyze</button>
    </div>
  );
};

export default QuickAnalysis;