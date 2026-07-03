import React, { useState } from 'react';
import { Save } from 'lucide-react';

const NotificationSettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    smtpHost: '', smtpPort: 587, emailNotifications: true, examReminders: true, 
    resultNotifications: true, passwordResetEmails: true, welcomeEmails: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(formData);
    setSaving(false);
  };

  const Toggle = ({ label, field }) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={formData[field]} onChange={e => setFormData({...formData, [field]: e.target.checked})} />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
      </label>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Notifications & Email</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="pb-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-4">SMTP Configuration</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SMTP Host</label>
                <input type="text" value={formData.smtpHost} onChange={e => setFormData({...formData, smtpHost: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">SMTP Port</label>
                <input type="number" value={formData.smtpPort} onChange={e => setFormData({...formData, smtpPort: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
              </div>
              <button type="button" className="text-sm text-emerald-600 font-bold hover:text-emerald-700">Send Test Email</button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-900 mb-4">System Notifications</h4>
          <Toggle label="Enable All Email Notifications" field="emailNotifications" />
          <Toggle label="Exam Reminders" field="examReminders" />
          <Toggle label="Result Notifications" field="resultNotifications" />
          <Toggle label="Password Reset Emails" field="passwordResetEmails" />
          <Toggle label="Welcome Emails (New Accounts)" field="welcomeEmails" />
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

export default NotificationSettings;
