import React from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { FacultyLogin } from './pages/FacultyLogin';
import { AdminLogin } from './pages/AdminLogin';
import { StudentDashboard } from './pages/StudentDashboard';
import StudentOverview from './pages/student/StudentOverview';
import StudentProfile from './pages/student/StudentProfile';
import { CodingProgress } from './pages/student/CodingProgress'; 
import { TeacherDashboard } from './pages/TeacherDashboard';
import TeacherOverview from './pages/teacher/TeacherOverview';
import TeacherMonitoring from './pages/teacher/TeacherMonitoring';
import { TeacherCodingProgress } from './pages/teacher/TeacherCodingProgress';
import ExamDetail from './pages/teacher/ExamDetail';
import { CompilerPage } from './pages/CompilerPage';
import { LiveExamPage } from './pages/LiveExamPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLayout from './components/admin/AdminLayout';
import ChangePassword from './pages/ChangePassword';
import SuperAdminLayout from './components/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import Departments from './pages/superadmin/Departments';
import DepartmentHeads from './pages/superadmin/DepartmentHeads';
import SuperAdminLogin from './pages/superadmin/Login';

// ── Protected Route wrapper ──────────────────────────────────────
// Supports a `redirectTo` prop so superadmin routes redirect to their
// own login page instead of the landing page.
const ProtectedRoute = ({ children, roles, redirectTo = '/' }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// ── Placeholder page for routes not yet built ────────────────────
const ComingSoon = ({ title }) => (
  <div className="flex items-center justify-center h-full min-h-[60vh]">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400">This section is under development.</p>
    </div>
  </div>
);

function App() {
  const location = useLocation();
  const isLiveExam = location.pathname.includes('/exam/live/');
  const isCompiler = location.pathname === '/compiler';
  const isAdmin = location.pathname === '/admin';
  const isSuperAdmin = location.pathname.startsWith('/superadmin');
  const isChangePass = location.pathname === '/change-password';
  
  const isAuthPage = ['/', '/fac', '/adm'].includes(location.pathname);

  return (
    <AuthProvider>
      <div className={`min-h-screen font-sans flex flex-col ${isLiveExam || isCompiler ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
        
        {!isLiveExam && !isCompiler && !isAuthPage && !isAdmin && !isChangePass && !isSuperAdmin && (
          <header className="px-4 md:px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
              <span className="text-3xl">🛡️</span>
              <span className="text-xl font-extrabold text-gray-900 tracking-tight hidden md:block">Nexus Proctor</span>
            </div>
          </header>
        )}

        <main className={`flex-grow ${isLiveExam || isCompiler || isAuthPage || isAdmin || isChangePass || isSuperAdmin ? '' : 'p-4 md:p-8'}`}>
          <Routes>
            {/* ── Public Auth Pages ─────────────────────────────── */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/fac" element={<FacultyLogin />} />
            <Route path="/adm" element={<AdminLogin />} />

            {/* ── Super Admin Login (public) ────────────────────── */}
            <Route path="/superadmin/login" element={<SuperAdminLogin />} />

            {/* ── Student Dashboard ─────────────────────────────── */}
            <Route path="/student-dashboard" element={
              <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<StudentOverview />} />
              <Route path="profile" element={<StudentProfile />} />
              <Route path="coding-progress" element={<CodingProgress />} />
            </Route>

            {/* ── Teacher Dashboard ─────────────────────────────── */}
            <Route path="/teacher-dashboard" element={
              <ProtectedRoute roles={['faculty','teacher']}><TeacherDashboard /></ProtectedRoute>
            }>
              <Route index element={<Navigate to="overview" replace />} />
              <Route path="overview" element={<TeacherOverview />} />
              <Route path="monitoring" element={<TeacherMonitoring />} />
              <Route path="coding-progress" element={<TeacherCodingProgress />} />
              <Route path="exams/:examId" element={<ExamDetail />} />
              <Route path="exams/:examId/submissions/:submissionId" element={<ExamDetail />} />
            </Route>

            {/* ── Admin Dashboard ───────────────────────────────── */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin']} redirectTo="/adm">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="teachers" replace />} />
              <Route path="dashboard" element={<ComingSoon title="Dashboard Overview" />} />
              <Route path="teachers" element={<AdminDashboard />} />
              <Route path="students" element={<ComingSoon title="Students" />} />
              <Route path="subjects" element={<ComingSoon title="Subjects" />} />
              <Route path="exams" element={<ComingSoon title="Exams" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
              <Route path="activity-logs" element={<ComingSoon title="Activity Logs" />} />
              <Route path="profile" element={<ComingSoon title="Profile" />} />
            </Route>

            {/* ── Super Admin Portal (protected, nested) ────────── */}
            <Route path="/superadmin" element={
              <ProtectedRoute roles={['superadmin']} redirectTo="/superadmin/login">
                <SuperAdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<SuperAdminDashboard />} />
              <Route path="departments" element={<Departments />} />
              <Route path="department-heads" element={<DepartmentHeads />} />
              <Route path="teachers" element={<ComingSoon title="Teachers" />} />
              <Route path="students" element={<ComingSoon title="Students" />} />
              <Route path="subjects" element={<ComingSoon title="Subjects" />} />
              <Route path="exams" element={<ComingSoon title="Exams" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
              <Route path="activity-logs" element={<ComingSoon title="Activity Logs" />} />
              <Route path="settings" element={<ComingSoon title="Settings" />} />
              <Route path="profile" element={<ComingSoon title="Profile" />} />
            </Route>

            {/* ── Misc Protected Routes ─────────────────────────── */}
            <Route path="/change-password" element={
              <ProtectedRoute><ChangePassword /></ProtectedRoute>
            } />

            <Route path="/compiler" element={
              <ProtectedRoute><CompilerPage /></ProtectedRoute>
            } />

            <Route path="/exam/live/:id" element={
              <ProtectedRoute roles={['student']}><LiveExamPage /></ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;