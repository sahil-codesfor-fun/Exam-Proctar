import React from 'react';
import { Activity, ShieldAlert, Download } from 'lucide-react';

const AuditLogsSettings = () => {
  const logs = [
    { type: 'security', event: 'Failed Login Attempt', user: 'admin@nexus.edu', ip: '192.168.1.45', time: '10 mins ago' },
    { type: 'activity', event: 'Exam Created: Midterms', user: 'prof.smith@nexus.edu', ip: '10.0.0.12', time: '1 hour ago' },
    { type: 'security', event: 'Password Reset Requested', user: 'student101@nexus.edu', ip: '172.16.0.4', time: '3 hours ago' },
    { type: 'activity', event: 'Department Added: Physics', user: 'superadmin@nexus.edu', ip: '192.168.1.1', time: '5 hours ago' },
  ];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Reports & Audit Logs</h3>
          <p className="text-sm text-gray-500">Read-only view of system activity.</p>
        </div>
        <button type="button" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>
      
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-widest text-xs">
            <tr>
              <th className="px-4 py-3 border-b border-gray-100">Type</th>
              <th className="px-4 py-3 border-b border-gray-100">Event</th>
              <th className="px-4 py-3 border-b border-gray-100">User</th>
              <th className="px-4 py-3 border-b border-gray-100">IP Address</th>
              <th className="px-4 py-3 border-b border-gray-100">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-4">
                  {log.type === 'security' ? (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-md text-xs font-bold w-max">
                      <ShieldAlert className="w-3 h-3" /> Security
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-bold w-max">
                      <Activity className="w-3 h-3" /> Activity
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 font-bold text-gray-900">{log.event}</td>
                <td className="px-4 py-4 text-gray-600">{log.user}</td>
                <td className="px-4 py-4 text-gray-500 font-mono text-xs">{log.ip}</td>
                <td className="px-4 py-4 text-gray-400">{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogsSettings;
