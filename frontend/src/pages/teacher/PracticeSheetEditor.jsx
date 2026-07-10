import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Plus, Code, Trash2, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const PracticeSheetEditor = ({ sheetId, onClose, onSave }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'draft',
    dueDate: '',
    publishAt: ''
  });

  const [questions, setQuestions] = useState([]);
  
  // Quick mock for question search in bank
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Validation state
  const [uploadErrors, setUploadErrors] = useState([]);
  const [expandedQ, setExpandedQ] = useState(null);

  useEffect(() => {
    if (sheetId) {
      const fetchSheet = async () => {
        try {
          setLoading(true);
          const res = await api.get(`/practice/${sheetId}`);
          const sheet = res.data.sheet;
          setForm({
            title: sheet.title || '',
            description: sheet.description || '',
            status: sheet.status || 'draft',
            publishAt: sheet.publishAt ? new Date(sheet.publishAt).toISOString().slice(0,16) : '',
            dueDate: sheet.dueDate ? new Date(sheet.dueDate).toISOString().slice(0,16) : ''
          });
          if (sheet.questions) {
            setQuestions(sheet.questions.map(q => ({
              id: q.question.id,
              title: q.question.title,
              description: q.question.description,
              difficulty: q.question.difficulty,
              topic: q.question.topic,
              points: q.question.points,
              testCases: q.question.testCases || []
            })));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchSheet();
    }
  }, [sheetId]);

  const handleSaveBtn = async (status = 'draft') => {
    try {
      setSaving(true);
      const payload = { ...form, status, questions };
      if (sheetId) {
        await api.put(`/practice/${sheetId}`, payload);
      } else {
        await api.post('/practice', payload);
      }
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearching(true);
    try {
      // For now, let's just mock or call a general questions endpoint if it exists
      // const res = await api.get(`/questions?search=${searchQuery}&type=coding`);
      // setSearchResults(res.data.data);
      
      // Temporary mock data to test UI
      setSearchResults([
        { id: '1', title: 'Two Sum', difficulty: 'easy', topic: 'Arrays' },
        { id: '2', title: 'Valid Parentheses', difficulty: 'easy', topic: 'Stacks' },
        { id: '3', title: 'Longest Substring', difficulty: 'medium', topic: 'Strings' }
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const parseCSV = (text) => {
      const lines = [];
      let currentLine = '';
      let inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === '"') inQuotes = !inQuotes;
        if (char === '\n' && !inQuotes) {
          lines.push(currentLine);
          currentLine = '';
        } else {
          currentLine += char;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      return lines.map(line => {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"' && line[i+1] === '"') {
            current += '"';
            i++;
          } else if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      });
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const csvText = event.target.result;
      const rows = parseCSV(csvText);
      if (rows.length < 2) {
        setUploadErrors(['CSV file must contain a header row and at least one question.']);
        return;
      }
      
      const headers = rows[0].map(h => h?.toLowerCase().trim());
      
      const parsedQuestions = [];
      const errors = [];
      
      for (let i = 1; i < rows.length; i++) {
        const values = rows[i];
        if (!values || values.length === 0 || (!values[0] && !values[1])) continue;
        
        const q = { id: `temp_${Date.now()}_${i}`, testCases: [] };
        let tcMap = {}; // Group test case fields by index (e.g. 1, 2)
        
        headers.forEach((h, idx) => {
          const val = values[idx];
          if (h === 'title') q.title = val?.trim() || '';
          else if (h === 'description') q.description = val?.trim() || '';
          else if (h === 'difficulty') q.difficulty = (val?.trim() || 'medium').toLowerCase();
          else if (h === 'topic') q.topic = val?.trim() || 'General';
          else if (h === 'points') q.points = parseInt(val) || 10;
          else if (h.startsWith('tc') && h.includes('_')) {
             // e.g. tc1_in, tc1_out, tc1_hidden
             const parts = h.split('_');
             const tcIdx = parts[0].replace('tc', '');
             const field = parts[1];
             if (!tcMap[tcIdx]) tcMap[tcIdx] = { isHidden: false };
             if (field === 'in') tcMap[tcIdx].input = val;
             if (field === 'out') tcMap[tcIdx].expectedOutput = val;
             if (field === 'hidden') tcMap[tcIdx].isHidden = (val?.toLowerCase() === 'true' || val === '1');
          }
        });
        
        // Push parsed test cases
        Object.keys(tcMap).forEach(key => {
          if (tcMap[key].input || tcMap[key].expectedOutput) {
            q.testCases.push(tcMap[key]);
          }
        });
        
        q.type = 'coding';
        
        // Validations
        if (!q.title) errors.push(`Row ${i+1}: Missing Title.`);
        if (!q.description) errors.push(`Row ${i+1}: Missing Description.`);
        if (q.testCases.length === 0) errors.push(`Row ${i+1}: Missing Test Cases (requires at least one tc1_in, tc1_out).`);
        if (questions.some(existing => existing.title.toLowerCase() === q.title.toLowerCase())) {
          errors.push(`Row ${i+1}: Duplicate Question Title '${q.title}' (already in sheet).`);
        }
        
        parsedQuestions.push(q);
      }

      if (errors.length > 0) {
        setUploadErrors(errors);
        return; // Block upload if there are validation errors
      }

      setUploadErrors([]);
      setQuestions(prev => [...prev, ...parsedQuestions]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const addQuestion = (q) => {
    if (!questions.find(existing => existing.id === q.id)) {
      setQuestions([...questions, q]);
    }
  };

  const removeQuestion = (qId) => {
    setQuestions(questions.filter(q => q.id !== qId));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => { if(onClose) onClose(); else navigate('/teacher-dashboard/practice-manager'); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-gray-900">{sheetId ? 'Edit Practice Sheet' : 'New Practice Sheet'}</h1>
        </div>
        <div className="flex gap-3">
          {sheetId && (
            <button onClick={() => window.open(`/compiler?practiceSheetId=${sheetId}`, '_blank')} className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs uppercase tracking-widest rounded-xl border border-blue-200 transition-all">
              👀 Preview
            </button>
          )}
          <button onClick={() => handleSaveBtn('draft')} disabled={saving} className="px-5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs uppercase tracking-widest rounded-xl border transition-all disabled:opacity-50 flex items-center gap-2">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div> Saving...</>
            ) : (
              'Save Draft'
            )}
          </button>
          <button onClick={() => handleSaveBtn('published')} disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-2 disabled:opacity-50">
            {saving ? (
              <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Publishing...</>
            ) : (
              <><Save size={16} /> Publish</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Settings */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Sheet Details</h2>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Title *</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border focus:border-emerald-400 focus:bg-white font-bold transition-all" placeholder="e.g. Week 1: Arrays & Hashing" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none border focus:border-emerald-400 focus:bg-white text-sm transition-all h-24 resize-none" placeholder="Provide instructions for the students..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Publish At</label>
                <input type="datetime-local" value={form.publishAt} onChange={e => setForm({...form, publishAt: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl outline-none border focus:border-emerald-400 focus:bg-white text-xs font-bold text-gray-600 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Due Date</label>
                <input type="datetime-local" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 rounded-xl outline-none border focus:border-emerald-400 focus:bg-white text-xs font-bold text-gray-600 transition-all" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Questions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Questions ({questions.length})</h2>
            </div>

            {/* Question Search */}
            <div className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search question bank (e.g. Two Sum, Arrays)" 
                className="flex-1 px-4 py-3 bg-gray-50 rounded-xl outline-none border focus:border-blue-400 focus:bg-white text-sm font-medium transition-all" 
              />
              <button onClick={handleSearch} disabled={searching} className="px-5 py-3 bg-blue-50 text-blue-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-blue-100 transition-all border border-blue-100">
                {searching ? '...' : 'Search'}
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkUpload} />
              <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-emerald-50 text-emerald-600 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all border border-emerald-100 flex items-center gap-2 whitespace-nowrap">
                <Upload size={16}/> CSV Import
              </button>
            </div>

            {/* Validation Errors */}
            {uploadErrors.length > 0 && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-h-48 overflow-y-auto">
                <h4 className="text-red-700 font-bold text-xs uppercase tracking-widest mb-2 flex justify-between items-center">
                  Import Errors
                  <button onClick={() => setUploadErrors([])} className="text-red-400 hover:text-red-600">✕</button>
                </h4>
                <ul className="list-disc pl-5 text-xs text-red-600 space-y-1">
                  {uploadErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 border rounded-xl space-y-2 max-h-48 overflow-y-auto">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search Results</h3>
                {searchResults.map(res => (
                  <div key={res.id} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm">
                    <div>
                      <div className="font-bold text-sm">{res.title}</div>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${res.difficulty === 'easy' ? 'bg-green-100 text-green-700' : res.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{res.difficulty}</span>
                        <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-black uppercase tracking-wider">{res.topic}</span>
                      </div>
                    </div>
                    <button onClick={() => addQuestion(res)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Questions List */}
            <div className="flex-1 space-y-3">
              {questions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3 pt-10">
                  <Code size={40} className="text-gray-200" />
                  <p className="text-sm font-medium">No questions added yet.</p>
                </div>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="bg-white rounded-xl border hover:shadow-md transition-all group">
                    <div 
                      className="flex items-center gap-4 p-4 cursor-pointer select-none"
                      onClick={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
                    >
                      <div className="font-black text-gray-300 text-lg w-6">{idx + 1}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{q.title}</h4>
                        <div className="flex gap-2 mt-1">
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{q.difficulty}</span>
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-black uppercase tracking-wider">{q.topic}</span>
                          {q.points && <span className="text-[9px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-black uppercase tracking-wider">{q.points} pts</span>}
                          {q.testCases?.length > 0 && <span className="text-[9px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded font-black uppercase tracking-wider">{q.testCases.length} test cases</span>}
                        </div>
                      </div>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${expandedQ === q.id ? 'rotate-180' : ''}`} />
                      <button onClick={(e) => { e.stopPropagation(); removeQuestion(q.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {expandedQ === q.id && (
                      <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        {/* Description */}
                        {q.description && (
                          <div className="mt-3">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description</h5>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg border">{q.description}</p>
                          </div>
                        )}
                        {/* Test Cases */}
                        {q.testCases?.length > 0 && (
                          <div className="mt-3">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Test Cases ({q.testCases.length})</h5>
                            <div className="space-y-2">
                              {q.testCases.map((tc, tcIdx) => (
                                <div key={tcIdx} className="bg-gray-50 border rounded-lg p-3 text-xs">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-gray-500 uppercase tracking-widest text-[10px]">Case {tcIdx + 1}</span>
                                    {tc.isHidden && <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-black uppercase tracking-wider">Hidden</span>}
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 block mb-1">Input</span>
                                      <pre className="bg-white border rounded p-2 text-gray-800 font-mono whitespace-pre-wrap break-all">{tc.input || '(empty)'}</pre>
                                    </div>
                                    <div>
                                      <span className="text-[10px] font-bold text-gray-400 block mb-1">Expected Output</span>
                                      <pre className="bg-white border rounded p-2 text-gray-800 font-mono whitespace-pre-wrap break-all">{tc.expectedOutput || '(empty)'}</pre>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {(!q.testCases || q.testCases.length === 0) && !q.description && (
                          <p className="text-sm text-gray-400 italic mt-3">No additional details available for this question.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeSheetEditor;
