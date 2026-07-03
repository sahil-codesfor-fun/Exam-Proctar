import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Settings, Code, FileText, LayoutGrid } from 'lucide-react';
import api from '../../../services/api';
const QuestionTypes = [
  { id: 'MCQ', label: 'Multiple Choice (MCQ)', icon: LayoutGrid },
  { id: 'Programming', label: 'Programming/Coding', icon: Code },
  { id: 'Subjective', label: 'Subjective/Essay', icon: FileText }
];

const QuestionPaperBuilder = ({ exam, onClose }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState(null); // The question currently being edited
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (exam && exam.questions) {
      setQuestions(exam.questions);
    }
  }, [exam]);

  const handleAddNew = (type) => {
    const newQ = {
      id: `temp-${Date.now()}`,
      type,
      title: '',
      description: '',
      points: 1,
      difficulty: 'medium',
      timeLimitSeconds: 0,
      options: type === 'MCQ' ? [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] : [],
      testCases: type === 'Programming' ? [{ input: '', expectedOutput: '', isHidden: false, points: 1 }] : [],
      programmingDetails: type === 'Programming' ? {
        allowedLanguages: '["python", "c", "cpp", "java", "javascript"]',
        timeLimit: 2000,
        memoryLimit: 256000,
        compilationLimit: 5000,
        starterCode: ''
      } : null
    };
    setActiveQuestion(newQ);
    setIsEditing(true);
  };

  const saveActiveQuestion = async () => {
    if (!activeQuestion.title || !activeQuestion.description) {
      alert("Title and description are required.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const isNew = activeQuestion.id.startsWith('temp-');
      let savedQ;

      if (isNew) {
        const res = await api.post(`/superadmin/exams/${exam.id}/questions`, {
          ...activeQuestion,
          id: undefined // Let DB generate ID
        });
        savedQ = res.data.data;
        setQuestions([...questions, savedQ]);
      } else {
        const res = await api.put(`/superadmin/exams/${exam.id}/questions/${activeQuestion.id}`, activeQuestion);
        savedQ = res.data.data;
        setQuestions(questions.map(q => q.id === savedQ.id ? savedQ : q));
      }
      setIsEditing(false);
      setActiveQuestion(null);
    } catch (error) {
      alert("Failed to save question: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const deleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      if (!id.startsWith('temp-')) {
        await api.delete(`/superadmin/exams/${exam.id}/questions/${id}`);
      }
      setQuestions(questions.filter(q => q.id !== id));
    } catch (error) {
      alert("Failed to delete question");
    }
  };

  const updateActiveQ = (field, value) => {
    setActiveQuestion(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 ">
          <div>
            <h2 className="text-xl font-bold text-gray-900 ">Question Paper Builder</h2>
            <p className="text-sm text-gray-500">{exam?.title || 'Unknown Exam'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 :bg-slate-700 text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          
          {/* Question List Sidebar */}
          <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/30 ">
            <div className="p-4 border-b border-gray-200 flex gap-2 overflow-x-auto">
              {QuestionTypes.map(qt => (
                <button 
                  key={qt.id}
                  onClick={() => handleAddNew(qt.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-blue-500 transition-colors whitespace-nowrap shadow-sm"
                >
                  <Plus size={14} />
                  <qt.icon size={14} />
                  {qt.label.split(' ')[0]}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {questions.length === 0 ? (
                <div className="text-center text-gray-500 mt-10 text-sm">No questions added yet. Add one from above.</div>
              ) : (
                questions.map((q, idx) => (
                  <div 
                    key={q.id}
                    onClick={() => { setActiveQuestion(q); setIsEditing(true); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${activeQuestion?.id === q.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 ">
                        Q{idx + 1} • {q.type}
                      </span>
                      <div className="flex gap-1">
                        <span className="text-xs text-gray-500">{q.points} pts</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteQuestion(q.id); }} className="text-red-400 hover:text-red-600 ml-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-900 line-clamp-2">
                      {q.title || 'Untitled Question'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 flex flex-col bg-white ">
            {isEditing && activeQuestion ? (
              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Title *</label>
                    <input 
                      value={activeQuestion.title} 
                      onChange={(e) => updateActiveQ('title', e.target.value)} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g. What is the time complexity of Binary Search?" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points *</label>
                    <input 
                      type="number" min="1"
                      value={activeQuestion.points} 
                      onChange={(e) => updateActiveQ('points', parseInt(e.target.value))} 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description / Problem Statement *</label>
                  <textarea 
                    value={activeQuestion.description} 
                    onChange={(e) => updateActiveQ('description', e.target.value)} 
                    rows="4"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Provide full details..."
                  ></textarea>
                </div>

                {/* Type Specific Fields */}
                
                {activeQuestion.type === 'MCQ' && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 ">Options</label>
                    {activeQuestion.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type="radio" 
                          name="correctOption"
                          checked={opt.isCorrect}
                          onChange={() => {
                            const newOpts = activeQuestion.options.map((o, idx) => ({ ...o, isCorrect: idx === i }));
                            updateActiveQ('options', newOpts);
                          }}
                          className="w-5 h-5 text-blue-600 cursor-pointer"
                        />
                        <input 
                          value={opt.text}
                          onChange={(e) => {
                            const newOpts = [...activeQuestion.options];
                            newOpts[i].text = e.target.value;
                            updateActiveQ('options', newOpts);
                          }}
                          className="flex-1 px-3 py-2 border rounded-lg "
                          placeholder={`Option ${i + 1}`}
                        />
                        <button 
                          onClick={() => {
                            const newOpts = activeQuestion.options.filter((_, idx) => idx !== i);
                            updateActiveQ('options', newOpts);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 :bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => updateActiveQ('options', [...activeQuestion.options, { text: '', isCorrect: false }])}
                      className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} /> Add Option
                    </button>
                  </div>
                )}

                {activeQuestion.type === 'Programming' && activeQuestion.programmingDetails && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (ms)</label>
                        <input type="number" value={activeQuestion.programmingDetails.timeLimit} onChange={(e) => updateActiveQ('programmingDetails', { ...activeQuestion.programmingDetails, timeLimit: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg " />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Memory Limit (KB)</label>
                        <input type="number" value={activeQuestion.programmingDetails.memoryLimit} onChange={(e) => updateActiveQ('programmingDetails', { ...activeQuestion.programmingDetails, memoryLimit: parseInt(e.target.value) })} className="w-full px-3 py-2 border rounded-lg " />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Starter Code</label>
                      <textarea 
                        value={activeQuestion.programmingDetails.starterCode || ''} 
                        onChange={(e) => updateActiveQ('programmingDetails', { ...activeQuestion.programmingDetails, starterCode: e.target.value })} 
                        rows="4"
                        className="w-full font-mono text-sm px-3 py-2 border rounded-lg " 
                        placeholder="// Write initial template code here..."
                      ></textarea>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700 ">Test Cases</label>
                        <button 
                          onClick={() => updateActiveQ('testCases', [...activeQuestion.testCases, { input: '', expectedOutput: '', isHidden: false, points: 1 }])}
                          className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 :bg-blue-900/50 transition-colors"
                        >
                          + Add Test Case
                        </button>
                      </div>
                      
                      {activeQuestion.testCases.map((tc, i) => (
                        <div key={i} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-600 ">Test Case {i + 1}</span>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-gray-600 ">
                                <input 
                                  type="checkbox" 
                                  checked={tc.isHidden} 
                                  onChange={(e) => {
                                    const newTCs = [...activeQuestion.testCases];
                                    newTCs[i].isHidden = e.target.checked;
                                    updateActiveQ('testCases', newTCs);
                                  }}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                Hidden
                              </label>
                              <button 
                                onClick={() => {
                                  const newTCs = activeQuestion.testCases.filter((_, idx) => idx !== i);
                                  updateActiveQ('testCases', newTCs);
                                }}
                                className="text-red-400 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Input</label>
                              <textarea 
                                value={tc.input} 
                                onChange={(e) => {
                                  const newTCs = [...activeQuestion.testCases];
                                  newTCs[i].input = e.target.value;
                                  updateActiveQ('testCases', newTCs);
                                }}
                                rows="2"
                                className="w-full font-mono text-sm px-2 py-1 border rounded "
                              ></textarea>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Expected Output</label>
                              <textarea 
                                value={tc.expectedOutput} 
                                onChange={(e) => {
                                  const newTCs = [...activeQuestion.testCases];
                                  newTCs[i].expectedOutput = e.target.value;
                                  updateActiveQ('testCases', newTCs);
                                }}
                                rows="2"
                                className="w-full font-mono text-sm px-2 py-1 border rounded "
                              ></textarea>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Actions */}
                <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button onClick={() => { setIsEditing(false); setActiveQuestion(null); }} className="px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-100 :bg-slate-800">
                    Cancel
                  </button>
                  <button onClick={saveActiveQuestion} disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50">
                    {loading ? 'Saving...' : 'Save Question'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Settings size={48} className="mb-4 opacity-20" />
                <p>Select a question to edit or add a new one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionPaperBuilder;
