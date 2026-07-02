import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, BookOpen, Clock, AlertCircle } from 'lucide-react';

const AdminSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(sub => 
    sub.status !== 'ARCHIVED' && (
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      sub.code.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Department Subjects</h2>
          <p className="text-gray-500 mt-1">View all subjects offered by your department.</p>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 text-blue-800">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-600" />
        <div className="text-sm">
          <p className="font-semibold text-blue-900">Subject Management</p>
          <p className="mt-1">
            Subjects are created and managed by the Super Admin. You can view your department's subjects here. 
            To allocate these subjects to your teachers, go to the <strong className="font-semibold">Teachers</strong> tab.
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="px-6 py-4">Subject Name</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Semester</th>
                <th className="px-6 py-4">Credits</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading subjects...</td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No subjects found in your department.
                  </td>
                </tr>
              ) : (
                filteredSubjects.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-gray-900">{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{sub.code}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{sub.semester ? `Semester ${sub.semester}` : '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{sub.credits || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        sub.status === 'ACTIVE' || sub.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSubjects;
