import React from "react";

type Watchlist = {
  // define the shape of Watchlist here
  id: string;
  name: string;
  // add other fields as needed
};

type WatchlistsProps = {
  key: string;
  watchlist: Watchlist;
  onAnalyze: () => Promise<void>;
};

const Watchlists: React.FC<WatchlistsProps> = ({ watchlist, onAnalyze }) => {
  // component implementation
  return (
    <div>
      <h2>{watchlist.name}</h2>
      <button onClick={onAnalyze}>Analyze</button>
    </div>
  );
};

export default Watchlists;