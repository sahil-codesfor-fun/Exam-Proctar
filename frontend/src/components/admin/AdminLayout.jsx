import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

import { useAuth } from '../../contexts/AuthContext';

const AdminLayout = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen w-full max-w-[100vw] overflow-hidden bg-gray-50 font-sans text-gray-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        <header className="py-4 border-b border-gray-200 bg-white flex items-center px-6 sticky top-0 z-30">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl">🛡️</span>
              <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">Admin <span className="text-emerald-600">Control Center</span></h1>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
              Faculty Management & Subject Allocation Portal
              {user && (
                <span className="ml-2 text-emerald-600 border-l border-gray-200 pl-2">
                  Welcome, {user.name} {user.departmentRel?.name ? `(${user.departmentRel.name} Dept)` : ''}
                </span>
              )}
            </p>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
