import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const SuperAdminLayout = () => {
  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 overflow-hidden">
        <header className="h-16 border-b border-gray-200 bg-white flex items-center px-6 sticky top-0 z-30">
          <h1 className="text-xl font-semibold text-emerald-600 tracking-tight">
            Nexus Super Admin
          </h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
