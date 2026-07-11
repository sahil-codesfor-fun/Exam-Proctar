import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  GraduationCap, 
  Users, 
  BookOpen, 
  BarChart3, 
  LogOut,
  Menu,
  X,
  User,
  Activity,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { name: 'Teachers', icon: GraduationCap, path: '/admin/teachers' },
    { name: 'Students', icon: Users, path: '/admin/students' },
    { name: 'Subjects', icon: BookOpen, path: '/admin/subjects' },
    { name: 'Appeals', icon: Activity, path: '/admin/tickets' },
    { name: 'Courses Hub', icon: UploadCloud, path: '/admin/courses-hub' },
    { name: 'Reports', icon: BarChart3, path: '/admin/reports' },
    { name: 'Activity Logs', icon: Activity, path: '/admin/activity-logs' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/adm');
  };

  return (
    <>
      <button 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 text-gray-700 rounded-md shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 text-gray-900 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 h-20 px-6 border-b border-gray-200">
          <span className="text-2xl">🛡️</span>
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">Nexus Proctor</span>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">Department Head</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Administrator'}</p>
          <p className="text-xs text-gray-400 truncate">{user?.departmentRel?.name || 'Department'}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-gray-900 text-white' 
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-1">
          <NavLink
            to="/admin/profile"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-gray-100 text-gray-900' 
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <User size={20} />
            <span className="font-medium">Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
