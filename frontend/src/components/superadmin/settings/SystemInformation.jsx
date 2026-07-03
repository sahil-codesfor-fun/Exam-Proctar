import React from 'react';
import { Server, Database, Code, Globe, Activity } from 'lucide-react';

const SystemInformation = () => {
  const sysInfo = [
    { label: 'Nexus Proctor Version', value: 'v2.1.0-beta', icon: Code },
    { label: 'Environment', value: 'Production', icon: Globe },
    { label: 'Prisma Version', value: '5.7.0', icon: Database },
    { label: 'Node.js Version', value: 'v24.x', icon: Server },
    { label: 'Database Provider', value: 'PostgreSQL (Aiven Cloud)', icon: Database },
    { label: 'API Status', value: 'Online', icon: Activity, status: 'good' },
    { label: 'Server Uptime', value: '14 days, 3 hours', icon: Activity },
    { label: 'Last Deployment Time', value: 'Feb 15, 2026', icon: Server },
  ];

  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-2">System Information</h3>
      <p className="text-sm text-gray-500 mb-8">Read-only information about your current environment and infrastructure.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sysInfo.map((info, i) => (
          <div key={i} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
              <info.icon className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{info.label}</p>
              {info.status === 'good' ? (
                <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {info.value}
                </span>
              ) : (
                <p className="text-sm font-bold text-gray-900">{info.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SystemInformation;
