import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LandingPage = lazy(() => import('./pages/LandingPage').then(module => ({ default: module.LandingPage })));
const FacultyLogin = lazy(() => import('./pages/FacultyLogin').then(module => ({ default: module.FacultyLogin })));
const AdminLogin = lazy(() => import('./pages/AdminLogin').then(module => ({ default: module.AdminLogin })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then(module => ({ default: module.StudentDashboard })));
const StudentOverview = lazy(() => import('./pages/student/StudentOverview'));
const StudentProfile = lazy(() => import('./pages/student/StudentProfile'));
const CodingProgress = lazy(() => import('./pages/student/CodingProgress').then(module => ({ default: module.CodingProgress })));
const StudentCourses = lazy(() => import('./pages/student/StudentCourses'));
const StudentCourseDetails = lazy(() => import('./pages/student/StudentCourseDetails'));
const StudentModule = lazy(() => import('./pages/student/StudentModule'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard').then(module => ({ default: module.TeacherDashboard })));
const TeacherOverview = lazy(() => import('./pages/teacher/TeacherOverview'));
const TeacherProfile = lazy(() => import('./pages/teacher/TeacherProfile'));
const TeacherCodingProgress = lazy(() => import('./pages/teacher/TeacherCodingProgress').then(module => ({ default: module.TeacherCodingProgress })));
const TeacherCourseProgress = lazy(() => import('./pages/teacher/TeacherCourseProgress').then(module => ({ default: module.TeacherCourseProgress })));
const PracticeManager = lazy(() => import('./pages/teacher/PracticeManager'));
const ExamDetail = lazy(() => import('./pages/teacher/ExamDetail'));
const CompilerPage = lazy(() => import('./pages/CompilerPage').then(module => ({ default: module.CompilerPage })));
const LiveExamPage = lazy(() => import('./pages/LiveExamPage').then(module => ({ default: module.LiveExamPage })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const SuperAdminLayout = lazy(() => import('./components/superadmin/SuperAdminLayout'));
const SuperAdminDashboard = lazy(() => import('./pages/superadmin/Dashboard'));
const Departments = lazy(() => import('./pages/superadmin/Departments'));
const DepartmentHeads = lazy(() => import('./pages/superadmin/DepartmentHeads'));
const SuperAdminTeachers = lazy(() => import('./pages/superadmin/Teachers'));
const Settings = lazy(() => import('./pages/superadmin/Settings'));
const SuperAdminLogin = lazy(() => import('./pages/superadmin/Login'));
const AdminSubjects = lazy(() => import('./pages/admin/Subjects'));
const AdminExams = lazy(() => import('./pages/admin/Exams'));
const AdminTickets = lazy(() => import('./pages/admin/AdminTickets'));
const CoursesHub = lazy(() => import('./pages/admin/CoursesHub'));

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
          <Suspense fallback={
            <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-900">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading module...</span>
              </div>
            </div>
          }>
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
                <Route path="courses" element={<StudentCourses />} />
                <Route path="courses/:courseId" element={<StudentCourseDetails />} />
                <Route path="courses/module/:moduleId" element={<StudentModule />} />
              </Route>

              {/* ── Teacher Dashboard ─────────────────────────────── */}
              <Route path="/teacher-dashboard" element={
                <ProtectedRoute roles={['faculty','teacher']} redirectTo="/fac"><TeacherDashboard /></ProtectedRoute>
              }>
                <Route index element={<Navigate to="overview" replace />} />
                <Route path="overview" element={<TeacherOverview />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="coding-progress" element={<TeacherCodingProgress />} />
                <Route path="course-progress" element={<TeacherCourseProgress />} />
                <Route path="practice-manager/*" element={<PracticeManager />} />
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
                <Route path="subjects" element={<AdminSubjects />} />
                <Route path="exams" element={<AdminExams />} />
                <Route path="tickets" element={<AdminTickets />} />
                <Route path="courses-hub" element={<CoursesHub />} />
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
                <Route path="teachers" element={<SuperAdminTeachers />} />
                <Route path="reports" element={<ComingSoon title="Reports" />} />
                <Route path="activity-logs" element={<ComingSoon title="Activity Logs" />} />
                <Route path="settings" element={<Settings />} />
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
          </Suspense>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;