import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, RefreshCcw, 
  MoreVertical, Edit, Eye, Copy, Trash2, Calendar, CheckCircle, Clock, Ban, Users, Activity
} from 'lucide-react';
import api from '../../services/api';
import StatCard from '../../components/superadmin/StatCard';
import CreateExamModal from '../../components/superadmin/exams/CreateExamModal';
import QuestionPaperBuilder from '../../components/superadmin/exams/QuestionPaperBuilder';
import AssignExamModal from '../../components/superadmin/exams/AssignExamModal';

const Exams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
    draft: 0,
    suspended: 0,
    totalStudents: 0,
    avgCompletion: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mock data for initial render to test UI structure until API connects cleanly
      // TODO: Replace with actual API call once verified
      const token = localStorage.getItem('token');
      const [examsRes, deptsRes] = await Promise.all([
        api.get('/superadmin/exams'),
        api.get('/superadmin/departments')
      ]);
      
      setExams(examsRes.data.data || []);
      setDepartments(deptsRes.data.data || []);
      calculateStats(examsRes.data.data || []);
    } catch (error) {
      console.error("Failed to fetch exams:", error);
    }
    setLoading(false);
  };

  const calculateStats = (data) => {
    const total = data.length;
    const active = data.filter(e => e.status === 'published' || e.status === 'active').length;
    const upcoming = data.filter(e => new Date(e.schedule?.startDate) > new Date()).length;
    const completed = data.filter(e => e.status === 'completed').length;
    const draft = data.filter(e => e.status === 'draft').length;
    const suspended = data.filter(e => e.status === 'suspended').length;
    
    // Simplistic calculation based on available data
    const totalStudents = data.reduce((acc, exam) => acc + (exam._count?.assignments || 0), 0);
    
    setStats({
      total, active, upcoming, completed, draft, suspended, totalStudents,
      avgCompletion: 92 // Mocking avg completion for now
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;
    try {
      await api.delete(`/superadmin/exams/${id}`);
      fetchData();
    } catch (error) {
      alert("Failed to delete exam");
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm("Publish this exam? Students will be able to see it if assigned.")) return;
    try {
      await api.post(`/superadmin/exams/${id}/publish`);
      fetchData();
    } catch (error) {
      alert("Failed to publish exam");
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/superadmin/exams/${id}/duplicate`);
      fetchData();
    } catch (error) {
      alert("Failed to duplicate exam");
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          exam.examCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exam.status === filterStatus;
    const matchesDept = filterDepartment === 'all' || exam.departmentId === filterDepartment;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 ">Exam Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage, schedule, and monitor enterprise examinations.</p>
        </div>
        <button 
          onClick={() => { setEditingExam(null); setShowCreateModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
        >
          <Plus size={20} />
          <span>Create Exam</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Exams', value: stats.total, icon: FileText, color: 'bg-rose-100 text-rose-600' },
          { label: 'Active Exams', value: stats.active, icon: CheckCircle, color: 'bg-cyan-100 text-cyan-600' },
          { label: 'Upcoming Exams', value: stats.upcoming, icon: Calendar, color: 'bg-purple-100 text-purple-600' },
          { label: 'Completed Exams', value: stats.completed, icon: Clock, color: 'bg-green-100 text-green-600' },
          { label: 'Draft Exams', value: stats.draft, icon: Edit, color: 'bg-gray-100 text-gray-600' },
          { label: 'Suspended Exams', value: stats.suspended, icon: Ban, color: 'bg-red-100 text-red-600' },
          { label: 'Total Students', value: stats.totalStudents, icon: Users, color: 'bg-violet-100 text-violet-600' },
          { label: 'Avg Completion', value: `${stats.avgCompletion}%`, icon: Activity, color: 'bg-orange-100 text-orange-600' }
        ].map((stat, idx) => (
          <StatCard 
            key={idx}
            title={stat.label} 
            value={stat.value} 
            icon={stat.icon} 
            colorClass={stat.color} 
            loading={loading}
          />
        ))}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search exams by name or code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 ">
            <Filter size={16} className="text-gray-400" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 "
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-1.5 bg-gray-50 ">
            <select 
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-gray-700 "
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => { setSearchTerm(''); setFilterStatus('all'); setFilterDepartment('all'); }}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 :bg-slate-700 text-gray-600 transition-colors"
            title="Reset Filters"
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 ">
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Exam Title & Code</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department / Subject</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Questions</th>
                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 ">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      Loading exams...
                    </div>
                  </td>
                </tr>
              ) : filteredExams.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500">
                    No exams found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredExams.map(exam => (
                  <tr key={exam.id} className="hover:bg-gray-50 :bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900 ">{exam.title}</div>
                      <div className="text-xs text-gray-500">{exam.examCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-gray-800 ">{exam.department?.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{exam.subject?.name || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 ">
                      {exam.schedule ? new Date(exam.schedule.startDate).toLocaleDateString() : 'Unscheduled'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${exam.status === 'published' ? 'bg-green-100 text-green-800 ' : 
                          exam.status === 'draft' ? 'bg-gray-100 text-gray-800 ' : 
                          'bg-blue-100 text-blue-800 '}`}>
                        {exam.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 ">
                      {exam._count?.questions || 0}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors" title="View/Edit">
                          <Edit size={16} onClick={() => { setEditingExam(exam); setShowCreateModal(true); }}/>
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-purple-500 transition-colors" title="Manage Questions" onClick={() => { setEditingExam(exam); setShowQuestionBuilder(true); }}>
                          <FileText size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors" title="Assign Exam" onClick={() => { setEditingExam(exam); setShowAssignModal(true); }}>
                          <Users size={16} />
                        </button>
                        {exam.status === 'draft' && (
                          <button className="p-1.5 text-gray-400 hover:text-green-500 transition-colors" title="Publish" onClick={() => handlePublish(exam.id)}>
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-orange-500 transition-colors" title="Duplicate" onClick={() => handleDuplicate(exam.id)}>
                          <Copy size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-red-500 transition-colors" onClick={() => handleDelete(exam.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Simple Pagination Placeholder */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50 ">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{filteredExams.length}</span> results
          </div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateExamModal 
          exam={editingExam} 
          onClose={() => setShowCreateModal(false)} 
          onSave={() => { setShowCreateModal(false); fetchData(); }} 
        />
      )}

      {showQuestionBuilder && editingExam && (
        <QuestionPaperBuilder
          exam={editingExam}
          onClose={() => setShowQuestionBuilder(false)}
        />
      )}

      {showAssignModal && editingExam && (
        <AssignExamModal
          exam={editingExam}
          onClose={() => setShowAssignModal(false)}
          onSave={() => { setShowAssignModal(false); fetchData(); }}
        />
      )}
    </div>
  );
};

export default Exams;
