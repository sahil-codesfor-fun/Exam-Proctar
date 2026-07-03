import React, { useState } from 'react';
import { Save } from 'lucide-react';

const UniversitySettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    name: '', email: '', phone: '', address: '', website: '', academicYear: '', timeZone: ''
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
      <h3 className="text-xl font-bold text-gray-900 mb-6">University Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">University Name</label>
          <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Academic Year</label>
          <input type="text" value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Email</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Contact Number</label>
          <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Address</label>
          <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Website</label>
          <input type="url" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Time Zone</label>
          <input type="text" value={formData.timeZone} onChange={e => setFormData({...formData, timeZone: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
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

export default UniversitySettings;
