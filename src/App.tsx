import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// 🎯 미니멀 구조
import Home from './pages/Home';
import TaxCreditDashboard from './components/TaxCreditDashboard';
import PensionTestPage from './pages/PensionTestPage';

function App() {
  return (
    <Router>
    <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/:bizno" element={<TaxCreditDashboard />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/pension-test" element={<PensionTestPage />} />
          <Route path="/pension-test/:bizNo" element={<PensionTestPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
    </div>
    </Router>
  );
}

export default App;
