import React from 'react';
import { ShieldCheck, Check, X } from 'lucide-react';

const RolesPermissions = () => {
  const roles = [
    { name: 'Super Admin', access: 'Full System Access', users: 1 },
    { name: 'Admin (Dept Head)', access: 'Department Level', users: 12 },
    { name: 'Teacher', access: 'Subject & Exams', users: 145 },
    { name: 'Student', access: 'Taking Exams', users: 3400 },
  ];

  const permissions = [
    { module: 'User Management', superadmin: true, admin: true, teacher: false, student: false },
    { module: 'Exam Creation', superadmin: true, admin: true, teacher: true, student: false },
    { module: 'Taking Exams', superadmin: false, admin: false, teacher: false, student: true },
    { module: 'System Settings', superadmin: true, admin: false, teacher: false, student: false },
  ];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-900">Roles & Permissions</h3>
        <button type="button" className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-colors">
          + Create Custom Role
        </button>
      </div>
      
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <p className="font-bold text-gray-900">{role.name}</p>
                <p className="text-xs text-gray-500">{role.access}</p>
              </div>
            </div>
            <div className="text-sm font-bold text-gray-400">{role.users} Users</div>
          </div>
        ))}
      </div>

      <div>
        <h4 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-widest">Permission Matrix (Read-Only)</h4>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-xs">
              <tr>
                <th className="px-4 py-3 border-b border-gray-100">Module</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Super Admin</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Admin</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Teacher</th>
                <th className="px-4 py-3 border-b border-gray-100 text-center">Student</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map((p, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.module}</td>
                  <td className="px-4 py-3 text-center">{p.superadmin ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{p.admin ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{p.teacher ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                  <td className="px-4 py-3 text-center">{p.student ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> : <X className="w-4 h-4 text-gray-300 mx-auto" />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissions;
