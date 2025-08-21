type DashboardStatsProps = {
  stats: any; // Replace 'any' with a more specific type if available
  mlStatus: any; // Replace 'any' with a more specific type if available
};

const DashboardStats = ({ stats, mlStatus }: DashboardStatsProps) => {
  return (
    <div>
      <h2 className="text-xl font-bold">Dashboard Stats</h2>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
      <h3 className="text-lg font-semibold">ML Status</h3>
      <pre>{JSON.stringify(mlStatus, null, 2)}</pre>
    </div>
  );
};

export default DashboardStats;