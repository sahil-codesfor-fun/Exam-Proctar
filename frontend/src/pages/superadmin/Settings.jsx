import React, { useState, useEffect } from 'react';
import { User, Building2, Shield, Users, BookOpen, Bell, Database, FileText, Palette, Info, ArrowLeft } from 'lucide-react';
import api from '../../services/api';

import ProfileSettings from '../../components/superadmin/settings/ProfileSettings';
import UniversitySettings from '../../components/superadmin/settings/UniversitySettings';
import SecuritySettings from '../../components/superadmin/settings/SecuritySettings';
import RolesPermissions from '../../components/superadmin/settings/RolesPermissions';
import ExaminationSettings from '../../components/superadmin/settings/ExaminationSettings';
import NotificationSettings from '../../components/superadmin/settings/NotificationSettings';
import BackupSettings from '../../components/superadmin/settings/BackupSettings';
import AuditLogsSettings from '../../components/superadmin/settings/AuditLogsSettings';
import AppearanceSettings from '../../components/superadmin/settings/AppearanceSettings';
import SystemInformation from '../../components/superadmin/settings/SystemInformation';

const SETTINGS_MODULES = [
  { id: 'profile', icon: User, title: 'Profile & Account', desc: 'Manage your personal profile and credentials', color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 'university', icon: Building2, title: 'University Settings', desc: 'Configure university branding and details', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { id: 'security', icon: Shield, title: 'Security Settings', desc: 'Password policies and two-factor auth', color: 'text-red-500', bg: 'bg-red-50' },
  { id: 'roles', icon: Users, title: 'Roles & Permissions', desc: 'System access matrix and custom roles', color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 'examination', icon: BookOpen, title: 'Examination Settings', desc: 'Anti-cheat levels and default exam rules', color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 'notifications', icon: Bell, title: 'Notifications & Email', desc: 'SMTP config and system alerts', color: 'text-yellow-500', bg: 'bg-yellow-50' },
  { id: 'backup', icon: Database, title: 'Backup & Database', desc: 'Manual backups and system restore', color: 'text-teal-500', bg: 'bg-teal-50' },
  { id: 'audit', icon: FileText, title: 'Reports & Audit Logs', desc: 'View security events and system activity', color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 'appearance', icon: Palette, title: 'Appearance', desc: 'Theme colors and dashboard layout', color: 'text-pink-500', bg: 'bg-pink-50' },
  { id: 'system', icon: Info, title: 'System Information', desc: 'API status, environment, and versions', color: 'text-gray-500', bg: 'bg-gray-100' },
];

const Settings = () => {
  const [activeModule, setActiveModule] = useState(null);
  const [settingsData, setSettingsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettingsData(res.data.data);
      }
    } catch (err) {
      showToast('Failed to load settings from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const updateSettingModule = async (moduleName, data) => {
    try {
      const res = await api.put(`/settings/${moduleName}`, data);
      if (res.data.success) {
        setSettingsData(prev => ({ ...prev, [moduleName]: res.data.data }));
        showToast('Settings saved successfully');
        return true;
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save settings', 'error');
      return false;
    }
  };

  const renderActiveModule = () => {
    const props = {
      data: settingsData?.[activeModule],
      onSave: (data) => updateSettingModule(activeModule, data),
      showToast
    };

    switch (activeModule) {
      case 'profile': return <ProfileSettings {...props} />;
      case 'university': return <UniversitySettings {...props} />;
      case 'security': return <SecuritySettings {...props} />;
      case 'roles': return <RolesPermissions {...props} />;
      case 'examination': return <ExaminationSettings {...props} />;
      case 'notifications': return <NotificationSettings {...props} />;
      case 'backup': return <BackupSettings {...props} />;
      case 'audit': return <AuditLogsSettings {...props} />;
      case 'appearance': return <AppearanceSettings {...props} />;
      case 'system': return <SystemInformation {...props} />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="font-sans relative space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[600] animate-in slide-in-from-bottom-10 fade-in duration-300">
          <div className={`px-6 py-3.5 rounded-full shadow-2xl border flex items-center gap-3 text-sm font-bold ${
            toast.type === 'error' ? 'bg-red-600 text-white border-red-500 shadow-red-600/20' : 
            'bg-gray-900 text-white border-gray-700 shadow-xl'
          }`}>
            <span className="text-lg">{toast.type === 'error' ? '⚠️' : '✨'}</span>
            <span className="tracking-wide pr-2">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          {activeModule && (
            <button 
              onClick={() => setActiveModule(null)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-900" />
            </button>
          )}
          System Configuration Center
        </h2>
        <p className="text-gray-500 mt-1 pl-1">
          {activeModule 
            ? `Configure settings for ${SETTINGS_MODULES.find(m => m.id === activeModule)?.title}` 
            : 'Manage enterprise settings, security protocols, and system preferences.'}
        </p>
      </div>

      {/* Content Area */}
      {!activeModule ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {SETTINGS_MODULES.map((mod) => (
            <div 
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-2xl ${mod.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <mod.icon className={`w-7 h-7 ${mod.color}`} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-2">{mod.title}</h3>
              <p className="text-sm font-medium text-gray-500">{mod.desc}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-in fade-in zoom-in-95 duration-300">
          {renderActiveModule()}
        </div>
      )}
    </div>
  );
};

export default Settings;
