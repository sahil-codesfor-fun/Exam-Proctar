import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Building2, Users, GraduationCap, BookOpen, 
  FileText, Activity, CheckCircle, Database, Briefcase, Library, Link, Unlink, AlertCircle
} from 'lucide-react';
import StatCard from '../../components/superadmin/StatCard';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/superadmin/dashboard/stats');
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();

    const intervalId = setInterval(fetchStats, 5000);

    return () => clearInterval(intervalId);
  }, []);

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

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Total Departments" 
          value={stats?.departments || 0} 
          icon={Building2} 
          colorClass="bg-blue-100 text-blue-600" 
          onClick={() => navigate('/superadmin/departments')}
          loading={loading}
        />
        <StatCard 
          title="Department Heads" 
          value={stats?.departmentHeads || 0} 
          icon={Briefcase} 
          colorClass="bg-indigo-100 text-indigo-600" 
          onClick={() => navigate('/superadmin/department-heads')}
          loading={loading}
        />
        <StatCard 
          title="Total Teachers" 
          value={stats?.teachers || 0} 
          icon={GraduationCap} 
          colorClass="bg-emerald-100 text-emerald-600" 
          onClick={() => navigate('/superadmin/teachers')}
          loading={loading}
        />
        <StatCard 
          title="Total Students" 
          value={stats?.students || 0} 
          icon={Users} 
          colorClass="bg-violet-100 text-violet-600" 
          onClick={() => navigate('/superadmin/students')}
          loading={loading}
        />
        <StatCard 
          title="Total Subjects" 
          value={stats?.subjects || 0} 
          icon={BookOpen} 
          colorClass="bg-amber-100 text-amber-600" 
          onClick={() => navigate('/superadmin/subjects')}
          loading={loading}
        />
        <StatCard 
          title="Total Exams" 
          value={stats?.exams || 0} 
          icon={FileText} 
          colorClass="bg-rose-100 text-rose-600" 
          onClick={() => navigate('/superadmin/exams')}
          loading={loading}
        />
        <StatCard 
          title="Active Exams" 
          value={stats?.activeExams || 0} 
          icon={Activity} 
          colorClass="bg-cyan-100 text-cyan-600" 
          onClick={() => navigate('/superadmin/exams')}
          loading={loading}
        />
        <StatCard 
          title="Completed Exams" 
          value={stats?.completedExams || 0} 
          icon={CheckCircle} 
          colorClass="bg-green-100 text-green-600" 
          onClick={() => navigate('/superadmin/exams')}
          loading={loading}
        />
        <StatCard 
          title="Total Submissions" 
          value={stats?.totalSubmissions || 0} 
          icon={Database} 
          colorClass="bg-fuchsia-100 text-fuchsia-600" 
          onClick={() => navigate('/superadmin/submissions')}
          loading={loading}
        />
        
        {}
        <StatCard 
          title="Total Courses" 
          value={stats?.totalCourses || 0} 
          icon={Library} 
          colorClass="bg-sky-100 text-sky-600" 
          loading={loading}
        />
        <StatCard 
          title="Allocated Courses" 
          value={stats?.allocatedCourses || 0} 
          icon={Link} 
          colorClass="bg-teal-100 text-teal-600" 
          loading={loading}
        />
        <StatCard 
          title="Unallocated Courses" 
          value={stats?.unallocatedCourses || 0} 
          icon={Unlink} 
          colorClass="bg-orange-100 text-orange-600" 
          loading={loading}
        />
        <StatCard 
          title="Depts W/O Courses" 
          value={stats?.departmentsWithoutCourses || 0} 
          icon={AlertCircle} 
          colorClass="bg-red-100 text-red-600" 
          onClick={() => navigate('/superadmin/departments')}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Dashboard;
