import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import UploadResume from './pages/UploadResume';
import Dashboard from './pages/Dashboard';
import HiringPipeline from './pages/HiringPipeline';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import './index.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('hr_token');
  return token ? children : <Navigate to="/login" replace />;
}

function FloatingDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('hr_token');

  const logout = () => {
    localStorage.removeItem('hr_token');
    localStorage.removeItem('hr_name');
    localStorage.removeItem('hr_email');
    localStorage.removeItem('hr_role');
    navigate('/login');
  };

  if (!token || location.pathname === '/login') return null;

  return (
    <div className="floating-dock">
      <Link to="/" className={`dock-item ${location.pathname === '/' ? 'active' : ''}`}>
        Dashboard
      </Link>
      <Link to="/pipeline" className={`dock-item ${location.pathname === '/pipeline' ? 'active' : ''}`}>
        Pipeline
      </Link>
      <Link to="/analytics" className={`dock-item ${location.pathname === '/analytics' ? 'active' : ''}`}>
        Insights
      </Link>
      <Link to="/upload" className={`dock-item ${location.pathname === '/upload' ? 'active' : ''}`}>
        Upload
      </Link>
      <button onClick={logout} className="dock-item" style={{background:'transparent', border:'none', cursor:'pointer'}}>
        Logout
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <FloatingDock />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/"       element={<ProtectedRoute><div className="artisan-viewport"><Dashboard /></div></ProtectedRoute>} />
        <Route path="/pipeline" element={<ProtectedRoute><div className="artisan-viewport"><HiringPipeline /></div></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><div className="artisan-viewport"><Analytics /></div></ProtectedRoute>} />
        <Route path="/upload" element={<ProtectedRoute><div className="artisan-viewport"><UploadResume /></div></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}