import React, { useState } from 'react';
import { Save } from 'lucide-react';

const ExaminationSettings = ({ data, onSave }) => {
  const [formData, setFormData] = useState(data || {
    defaultDuration: 120, autoSubmit: true, fullscreenEnforcement: true, webcamRequirement: true,
    copyPasteRestriction: true, tabSwitchingDetection: true, antiCheatLevel: 'High'
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
      <h3 className="text-xl font-bold text-gray-900 mb-6">Examination Settings</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Default Exam Duration (Minutes)</label>
            <input type="number" value={formData.defaultDuration} onChange={e => setFormData({...formData, defaultDuration: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium" />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Default Anti-Cheat Level</label>
            <select value={formData.antiCheatLevel} onChange={e => setFormData({...formData, antiCheatLevel: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:bg-white focus:border-emerald-400 transition-all text-sm font-medium">
              <option value="Low">Low (Basic Logging)</option>
              <option value="Medium">Medium (Tab Tracking + Fullscreen)</option>
              <option value="High">High (Strict Webcam + AI Proctoring)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <Toggle label="Auto-Submit on Timeout" field="autoSubmit" />
          <Toggle label="Fullscreen Enforcement" field="fullscreenEnforcement" />
          <Toggle label="Webcam Requirement" field="webcamRequirement" />
          <Toggle label="Copy/Paste Restriction" field="copyPasteRestriction" />
          <Toggle label="Tab Switching Detection" field="tabSwitchingDetection" />
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

export default ExaminationSettings;
