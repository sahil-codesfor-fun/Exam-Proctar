import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Building2, Users, GraduationCap, BookOpen, 
  FileText, Activity, CheckCircle, Database 
} from 'lucide-react';
import StatCard from '../../components/superadmin/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

// Mock data for the chart until backend analytics is implemented
const chartData = [
  { name: 'Mon', exams: 4, submissions: 120 },
  { name: 'Tue', exams: 3, submissions: 98 },
  { name: 'Wed', exams: 7, submissions: 210 },
  { name: 'Thu', exams: 5, submissions: 150 },
  { name: 'Fri', exams: 8, submissions: 240 },
  { name: 'Sat', exams: 2, submissions: 60 },
  { name: 'Sun', exams: 1, submissions: 30 },
];

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/superadmin/dashboard/stats');
        setStats(res.data.data.stats);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
          <span className="text-gray-500">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.name}. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Departments" 
          value={stats?.totalDepartments || 0} 
          icon={Building2} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Total Teachers" 
          value={stats?.totalTeachers || 0} 
          icon={GraduationCap} 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Total Students" 
          value={stats?.totalStudents || 0} 
          icon={Users} 
          colorClass="bg-violet-100 text-violet-600" 
        />
        <StatCard 
          title="Total Subjects" 
          value={stats?.totalSubjects || 0} 
          icon={BookOpen} 
          colorClass="bg-amber-100 text-amber-600" 
        />
        <StatCard 
          title="Total Exams" 
          value={stats?.totalExams || 0} 
          icon={FileText} 
          colorClass="bg-rose-100 text-rose-600" 
        />
        <StatCard 
          title="Active Exams" 
          value={stats?.activeExams || 0} 
          icon={Activity} 
          colorClass="bg-cyan-100 text-cyan-600" 
        />
        <StatCard 
          title="Completed Exams" 
          value={stats?.completedExams || 0} 
          icon={CheckCircle} 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Total Submissions" 
          value={stats?.totalSubmissions || 0} 
          icon={Database} 
          colorClass="bg-fuchsia-100 text-fuchsia-600" 
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Activity (This Week)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', color: '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                />
                <Area type="monotone" dataKey="submissions" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSubmissions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500 font-medium">Server CPU</span>
                <span className="font-semibold text-emerald-600">24%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500 font-medium">Memory Usage</span>
                <span className="font-semibold text-blue-600">68%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-gray-500 font-medium">Storage Capacity</span>
                <span className="font-semibold text-amber-600">82%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
