type RecentActivityProps = {
  analyses: any[]; // Replace 'any' with a more specific type if available
};

const RecentActivity: React.FC<RecentActivityProps> = ({ analyses }) => {
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Recent Activity</h2>
      <ul>
        {analyses && analyses.length > 0 ? (
          analyses.map((item, idx) => (
            <li key={idx}>{JSON.stringify(item)}</li>
          ))
        ) : (
          <li>No recent analyses.</li>
        )}
      </ul>
    </div>
  );
};

export default RecentActivity;