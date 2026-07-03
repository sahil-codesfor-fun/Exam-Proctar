import React, { useState } from 'react';
import { Save } from 'lucide-react';

const ProfileSettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    name: 'Super Admin', email: 'admin@nexus.edu'
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
      <h3 className="text-xl font-bold text-gray-900 mb-6">Profile & Account</h3>
      
      <div className="flex items-center gap-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-bold">
          SA
        </div>
        <div>
          <button type="button" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors">
            Update Picture
          </button>
          <p className="text-xs text-gray-400 mt-2">JPG, GIF or PNG. Max size of 2MB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Full Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Email Address</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
      </div>

      <div className="mt-8 border-t border-gray-100 pt-8">
        <h4 className="text-sm font-bold text-gray-900 mb-4">Change Password</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <input type="password" placeholder="Current Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
           <input type="password" placeholder="New Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
           <input type="password" placeholder="Confirm Password"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50">
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </form>
  );
};

export default ProfileSettings;
