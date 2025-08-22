import { type Analysis } from '../../types';

interface AnalysisCardProps {
  analysis: Analysis;
  onClick: (id: number) => void;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysis, onClick }) => {
  return <div onClick={() => onClick(analysis.id)}>Analysis Card: {analysis.id}</div>;
};

export default AnalysisCard;