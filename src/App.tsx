import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import JournalPage from './pages/JournalPage';
import TimeCapsuleListPage from './pages/TimeCapsuleListPage';
import TimeCapsulePage from './pages/TimeCapsulePage';
import PlantPage from './pages/PlantPage';
import GardenPage from './pages/GardenPage';

function App() {
  const { isAuthenticated, isLoading, initialize, user } = useAuthStore();
  
  useEffect(() => {
    console.log('[NISHI] Calling initialize()');
    initialize();
  }, [initialize]);
  
  useEffect(() => {
    console.log('[NISHI] Auth state changed:', { user, isAuthenticated, isLoading });
  }, [user, isAuthenticated, isLoading]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-slate-600">Remember to Treat People with Kindness</p>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      <Routes>
        {/* Landing page - accessible to everyone */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Auth page - redirect to home if already authenticated */}
        <Route 
          path="/auth" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/home" />} 
        />
        
        {/* Protected routes - require authentication */}
        <Route 
          path="/home" 
          element={isAuthenticated ? <HomePage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/journal" 
          element={isAuthenticated ? <JournalPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/time-capsules" 
          element={isAuthenticated ? <TimeCapsuleListPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/time-capsule" 
          element={isAuthenticated ? <TimeCapsulePage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/garden" 
          element={isAuthenticated ? <GardenPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/plant/:plantId" 
          element={isAuthenticated ? <PlantPage /> : <Navigate to="/auth" />} 
        />
        
        {/* Catch all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;