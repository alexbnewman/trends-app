// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//import { AuthProvider } from './contexts/AuthContext.tsx';
import Header from './components/common/Header.tsx';
import Home from './pages/Home.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Search from './pages/Search.tsx';
import Watchlists from './pages/Watchlists.tsx';
import AnalysisPage from './pages/AnalysisPage.tsx';
import MLModels from './pages/MLModels.tsx';
import './App.css';

function App() {
  return (
    //<AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/search" element={<Search />} />
              <Route path="/watchlists" element={<Watchlists />} />
              <Route path="/analysis" element={<AnalysisPage />} />
              <Route path="/ml-models" element={<MLModels />} />
            </Routes>
          </main>
        </div>
      </Router>
   // </AuthProvider>
  );
}

export default App;