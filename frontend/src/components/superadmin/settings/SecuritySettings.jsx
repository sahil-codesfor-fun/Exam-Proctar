import React, { useState } from 'react';
import { Save } from 'lucide-react';

const SecuritySettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    passwordPolicy: 'Strong', sessionTimeout: 30, maxLoginAttempts: 5, twoFactorAuth: false
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Security Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Password Policy</label>
            <select value={formData.passwordPolicy} onChange={e => setFormData({...formData, passwordPolicy: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
              <option value="Basic">Basic (Min 8 chars)</option>
              <option value="Strong">Strong (Upper, Lower, Number, Symbol)</option>
              <option value="Maximum">Maximum (12 chars + Strong + Rotation)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Session Timeout (Minutes)</label>
            <input type="number" value={formData.sessionTimeout} onChange={e => setFormData({...formData, sessionTimeout: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Max Login Attempts</label>
            <input type="number" value={formData.maxLoginAttempts} onChange={e => setFormData({...formData, maxLoginAttempts: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <h4 className="font-bold text-blue-900 mb-2">Two-Factor Authentication</h4>
            <p className="text-sm text-blue-700 mb-4">Require all users to use 2FA when logging into the system.</p>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.twoFactorAuth} onChange={e => setFormData({...formData, twoFactorAuth: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 text-sm font-medium text-gray-900">{formData.twoFactorAuth ? 'Enabled' : 'Disabled'}</span>
            </label>
          </div>

          <div className="p-5 border border-red-100 bg-red-50 rounded-2xl">
            <h4 className="font-bold text-red-900 mb-2">Active Sessions</h4>
            <p className="text-sm text-red-700 mb-4">You have 3 active sessions across different devices.</p>
            <button type="button" className="px-4 py-2 bg-white text-red-600 border border-red-200 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">
              Logout from all devices
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </form>
  );
};

export default SecuritySettings;
