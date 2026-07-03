import React from 'react';
import { Database, HardDrive, Download, RotateCcw } from 'lucide-react';

const BackupSettings = () => {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Backup & Database</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                <Database className="w-6 h-6 text-teal-500" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Database Status</h4>
                <p className="text-sm text-emerald-600 font-bold">Online & Healthy</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Database Size</span>
                <span className="font-bold text-gray-900">142.5 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Backup</span>
                <span className="font-bold text-gray-900">2 hours ago</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Records</span>
                <span className="font-bold text-gray-900">~1.2M</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button type="button" className="w-full flex items-center justify-between p-4 bg-teal-50 border border-teal-100 rounded-xl hover:bg-teal-100 transition-colors group">
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-teal-600" />
              <div className="text-left">
                <h4 className="font-bold text-teal-900">Manual Backup</h4>
                <p className="text-xs text-teal-700">Download a full SQL dump</p>
              </div>
            </div>
            <span className="text-xs font-bold text-teal-600 uppercase tracking-widest group-hover:underline">Start</span>
          </button>

          <button type="button" className="w-full flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors group">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              <div className="text-left">
                <h4 className="font-bold text-orange-900">Restore Backup</h4>
                <p className="text-xs text-orange-700">Upload a previous SQL dump</p>
              </div>
            </div>
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest group-hover:underline">Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupSettings;
