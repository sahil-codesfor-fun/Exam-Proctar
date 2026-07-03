import React, { useState } from 'react';
import { Save, Moon, Sun, Monitor } from 'lucide-react';

const AppearanceSettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    themeMode: 'light', primaryColor: '#10B981', layout: 'fluid', compactMode: false
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
      <h3 className="text-xl font-bold text-gray-900 mb-6">Appearance</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Theme Mode</label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setFormData({...formData, themeMode: 'light'})}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.themeMode === 'light' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <Sun className="w-6 h-6" />
                <span className="font-bold text-sm">Light</span>
              </button>
              <button type="button" onClick={() => setFormData({...formData, themeMode: 'dark'})}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.themeMode === 'dark' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <Moon className="w-6 h-6" />
                <span className="font-bold text-sm">Dark</span>
              </button>
              <button type="button" onClick={() => setFormData({...formData, themeMode: 'system'})}
                className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${formData.themeMode === 'system' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-100 hover:border-gray-200 text-gray-600'}`}>
                <Monitor className="w-6 h-6" />
                <span className="font-bold text-sm">System</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary Color</label>
            <div className="flex items-center gap-3">
              <input type="color" value={formData.primaryColor} onChange={e => setFormData({...formData, primaryColor: e.target.value})}
                className="w-12 h-12 rounded cursor-pointer border-0 p-0" />
              <span className="text-sm font-mono text-gray-600">{formData.primaryColor}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Dashboard Layout</label>
            <select value={formData.layout} onChange={e => setFormData({...formData, layout: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
              <option value="fluid">Fluid (Full Width)</option>
              <option value="boxed">Boxed (Max Width)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
            <span className="text-sm font-bold text-gray-700">Compact Mode (High Data Density)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={formData.compactMode} onChange={e => setFormData({...formData, compactMode: e.target.checked})} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
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

export default AppearanceSettings;
