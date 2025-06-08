import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// 🎯 미니멀 구조
import Home from './pages/Home';
import TaxCreditDashboard from './components/TaxCreditDashboard';

function App() {
  return (
    <Router>
    <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/:bizno" element={<TaxCreditDashboard />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="*" element={<Home />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
