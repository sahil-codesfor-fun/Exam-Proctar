import React from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { ExamDashboard } from './pages/ExamDashboard';
// 🛑 MAKE SURE THIS IMPORT IS HERE!
import { TeacherDashboard } from './pages/TeacherDashboard'; 

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLandingPage = location.pathname === '/';

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
        {!isLandingPage && (
          <header className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <span className="text-2xl bg-blue-50 text-blue-600 p-2 rounded-lg">🛡️</span>
              <h1 className="text-xl font-extrabold tracking-tight">NEXUS <span className="text-blue-600">PROCTOR</span></h1>
            </div>
          </header>
        )}
        
        <main className={`flex-grow ${isLandingPage ? '' : 'p-4 md:p-8'}`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/student-dashboard" element={<StudentDashboard />} />
            <Route path="/exam" element={<ExamDashboard />} />
            {/* 🛑 MAKE SURE THIS ROUTE IS HERE! */}
            <Route path="/teacher-dashboard" element={<TeacherDashboard />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;