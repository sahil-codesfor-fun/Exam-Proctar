import React, { useState, useEffect } from 'react';
import { X, Settings, Shield, Edit3, Lock, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
const Tabs = [
  { id: 'basic', label: 'Basic Info', icon: Edit3 },
  { id: 'settings', label: 'Exam Settings', icon: Settings },
  { id: 'proctoring', label: 'Proctoring Config', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock }
];

const CreateExamModal = ({ exam, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    examCode: '',
    description: '',
    subjectId: '',
    examType: 'regular',
    difficulty: 'medium',
    instructions: '',
    // Schedule
    startDate: '',
    endDate: '',
    durationMinutes: 60,
    timeZone: 'UTC',
    // Settings
    randomizeQuestions: false,
    randomizeOptions: false,
    totalMarks: 0,
    passingMarks: 0,
    negativeMarking: false,
    autoSubmit: true,
    calculator: false,
    // Proctoring
    browserLock: true,
    fullscreenRequired: true,
    aiFaceDetection: true,
    tabSwitchingDetection: true,
    multipleMonitorDetection: true,
    microphoneMonitoring: true,
    violationSeverityLow: 3,
    violationSeverityHigh: 1,
    autoTerminateViolations: 5,
    // Security
    examPassword: '',
    ipRestriction: '',
    deviceRestriction: false,
  });

  useEffect(() => {
    fetchMetadata();
    if (exam) {
      // Pre-fill logic if editing
      setFormData(prev => ({
        ...prev,
        ...exam,
        startDate: exam.schedule?.startDate ? new Date(exam.schedule.startDate).toISOString().slice(0, 16) : '',
        endDate: exam.schedule?.endDate ? new Date(exam.schedule.endDate).toISOString().slice(0, 16) : '',
        durationMinutes: exam.schedule?.durationMinutes || 60,
        ...exam.settings
      }));
    } else {
      // Auto-generate a dummy exam code
      setFormData(prev => ({ ...prev, examCode: `EXAM-${Math.floor(1000 + Math.random() * 9000)}` }));
    }
  }, [exam]);

  const fetchMetadata = async () => {
    try {
      const token = localStorage.getItem('token');
      const [subjRes] = await Promise.all([
        api.get('/admin/subjects')
      ]);
      setSubjects(subjRes.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        title: formData.title,
        examCode: formData.examCode,
        description: formData.description,
        subjectId: formData.subjectId || undefined,
        examType: formData.examType,
        difficulty: formData.difficulty,
        instructions: formData.instructions,
        schedule: {
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate).toISOString(),
          durationMinutes: parseInt(formData.durationMinutes),
          timeZone: formData.timeZone,
        },
        settings: {
          randomizeQuestions: formData.randomizeQuestions,
          randomizeOptions: formData.randomizeOptions,
          totalMarks: parseInt(formData.totalMarks),
          passingMarks: parseInt(formData.passingMarks),
          negativeMarking: formData.negativeMarking,
          autoSubmit: formData.autoSubmit,
          calculator: formData.calculator,
          browserLock: formData.browserLock,
          fullscreenRequired: formData.fullscreenRequired,
          aiFaceDetection: formData.aiFaceDetection,
          tabSwitchingDetection: formData.tabSwitchingDetection,
          multipleMonitorDetection: formData.multipleMonitorDetection,
          microphoneMonitoring: formData.microphoneMonitoring,
          violationSeverityLow: parseInt(formData.violationSeverityLow),
          violationSeverityHigh: parseInt(formData.violationSeverityHigh),
          autoTerminateViolations: parseInt(formData.autoTerminateViolations),
          examPassword: formData.examPassword,
          ipRestriction: formData.ipRestriction,
          deviceRestriction: formData.deviceRestriction,
        }
      };

      if (exam?.id) {
        await api.put(`/admin/exams/${exam.id}`, payload);
      } else {
        await api.post('/admin/exams', payload);
      }
      onSave();
    } catch (error) {
      alert("Failed to save exam: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 ">
          <h2 className="text-xl font-bold text-gray-900 ">
            {exam ? 'Edit Exam' : 'Create New Exam'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 :bg-slate-700 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-gray-200 bg-gray-50/50 p-4 space-y-2 overflow-y-auto">
            {Tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id 
                    ? 'bg-blue-50 text-blue-600 ' 
                    : 'text-gray-600 hover:bg-gray-100 :bg-slate-800'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
                {activeTab === tab.id && <CheckCircle2 size={16} className="ml-auto opacity-50" />}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <form id="exam-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Basic Info Tab */}
              <div className={activeTab === 'basic' ? 'block' : 'hidden'}>
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exam Title *</label>
                      <input required name="title" value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " placeholder="e.g. Midterm Computer Science" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Exam Code</label>
                      <input required name="examCode" value={formData.examCode} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="w-full px-3 py-2 border rounded-lg " placeholder="Brief description of the exam..."></textarea>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="col-span-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                      <select name="subjectId" value={formData.subjectId} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg ">
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                  <div className="grid grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date & Time *</label>
                      <input required type="datetime-local" name="startDate" value={formData.startDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date & Time *</label>
                      <input required type="datetime-local" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Mins) *</label>
                      <input required type="number" min="1" name="durationMinutes" value={formData.durationMinutes} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                  </div>
                </div>
              </div>

              {/* Exam Settings Tab */}
              <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="randomizeQuestions" checked={formData.randomizeQuestions} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Randomize Questions</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="randomizeOptions" checked={formData.randomizeOptions} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Randomize Options</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="negativeMarking" checked={formData.negativeMarking} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Negative Marking</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="autoSubmit" checked={formData.autoSubmit} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Auto Submit on Time Up</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="calculator" checked={formData.calculator} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Allow On-screen Calculator</span>
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-5 pt-4 border-t border-gray-200 ">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                      <input type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Passing Marks</label>
                      <input type="number" name="passingMarks" value={formData.passingMarks} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                    </div>
                  </div>
                </div>
              </div>

              {/* Proctoring Tab */}
              <div className={activeTab === 'proctoring' ? 'block' : 'hidden'}>
                <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100 ">
                  Configure AI-based proctoring mechanisms. High severity violations trigger immediate actions.
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-6">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="browserLock" checked={formData.browserLock} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 font-medium">Browser Lock (Safe Exam Browser)</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="fullscreenRequired" checked={formData.fullscreenRequired} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 font-medium">Require Fullscreen</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="aiFaceDetection" checked={formData.aiFaceDetection} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 ">AI Face Detection</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="tabSwitchingDetection" checked={formData.tabSwitchingDetection} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 ">Tab Switching Detection</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="multipleMonitorDetection" checked={formData.multipleMonitorDetection} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 ">Multiple Monitor Detection</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" name="microphoneMonitoring" checked={formData.microphoneMonitoring} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                    <span className="text-gray-700 ">Microphone Audio Monitoring</span>
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-5 pt-4 border-t border-gray-200 ">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warnings before Medium Sev.</label>
                    <input type="number" name="violationSeverityLow" value={formData.violationSeverityLow} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Warnings before High Sev.</label>
                    <input type="number" name="violationSeverityHigh" value={formData.violationSeverityHigh} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Auto Terminate at Violations</label>
                    <input type="number" name="autoTerminateViolations" value={formData.autoTerminateViolations} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " />
                  </div>
                </div>
              </div>

              {/* Security Tab */}
              <div className={activeTab === 'security' ? 'block' : 'hidden'}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Exam Password (Optional)</label>
                    <input type="password" name="examPassword" value={formData.examPassword} onChange={handleChange} className="w-full md:w-1/2 px-3 py-2 border rounded-lg " placeholder="Leave blank for none" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP Restriction (Whitelist)</label>
                    <input type="text" name="ipRestriction" value={formData.ipRestriction} onChange={handleChange} className="w-full px-3 py-2 border rounded-lg " placeholder="e.g. 192.168.1.0/24 (Comma separated)" />
                  </div>

                  <div className="pt-4 border-t border-gray-200 ">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" name="deviceRestriction" checked={formData.deviceRestriction} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-gray-700 ">Restrict to Approved Devices Only (MAC Address binding)</span>
                    </label>
                  </div>
                </div>
              </div>

            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 :bg-slate-700 transition-colors">
            Cancel
          </button>
          <button type="submit" form="exam-form" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...</>
            ) : (
              'Save Exam'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CreateExamModal;
