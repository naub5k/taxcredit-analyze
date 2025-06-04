import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// 페이지 컴포넌트들
import HomePage from './pages/HomePage';
import RegionSearch from './pages/RegionSearch';
import CompanyDetail from './pages/CompanyDetail';
import PartnerPage from './pages/PartnerPage';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/region" element={<RegionSearch />} />
          <Route path="/company/:bizno" element={<CompanyDetail />} />
          <Route path="/partner" element={<PartnerPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
