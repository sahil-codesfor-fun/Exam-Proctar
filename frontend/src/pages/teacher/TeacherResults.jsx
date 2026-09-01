import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Award, FileText, CheckCircle2, Clock, Users, ArrowRight, ChevronRight, BarChart2 } from 'lucide-react';
import api from '../../services/api';
import HistoricalSubmissions from '../../components/results/HistoricalSubmissions';

const TeacherResults = () => {
  const { examId, submissionId } = useParams();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState(examId || '');
  const [loadingExams, setLoadingExams] = useState(true);

  useEffect(() => {
    setLoadingExams(true);
    api.get('/exams')
      .then(res => {
        const list = res.data.data || [];
        setExams(list);
        if (!selectedExamId && list.length > 0) {
          setSelectedExamId(list[0]._id || list[0].id);
        }
      })
      .catch(err => console.error('Failed to fetch exams:', err))
      .finally(() => setLoadingExams(false));
  }, []);

  useEffect(() => {
    if (examId) {
      setSelectedExamId(examId);
    }
  }, [examId]);

  const handleExamChange = (e) => {
    const newId = e.target.value;
    setSelectedExamId(newId);
    if (newId) {
      navigate(`/teacher-dashboard/results/${newId}`);
    } else {
      navigate('/teacher-dashboard/results');
    }
  };

  const selectedExam = exams.find(e => (e._id || e.id) === selectedExamId);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* ─── Header ─── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 rounded-3xl border shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-emerald-700 uppercase tracking-widest mb-1">
            <Award size={16} /> Results & Evaluation Portal
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Student Assessment Vault
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-1">
            Review full student responses, evaluate subjective answers, and publish updated scores.
          </p>
        </div>

        {/* ─── Exam Selector Dropdown ─── */}
        <div className="w-full lg:w-80">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">
            Select Exam
          </label>
          <select
            value={selectedExamId}
            onChange={handleExamChange}
            disabled={loadingExams}
            className="w-full px-4 py-3 bg-gray-50 rounded-2xl border border-gray-200 text-sm font-bold text-gray-800 outline-none focus:border-emerald-600 focus:bg-white transition-all cursor-pointer shadow-sm"
          >
            {loadingExams ? (
              <option>Loading exams...</option>
            ) : exams.length === 0 ? (
              <option>No exams created yet</option>
            ) : (
              exams.map(e => (
                <option key={e._id || e.id} value={e._id || e.id}>
                  {e.title} ({e.course || 'General'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      {selectedExam ? (
        <div className="space-y-6">
          <HistoricalSubmissions exam={selectedExam} />
        </div>
      ) : !loadingExams ? (
        <div className="bg-white rounded-3xl p-12 text-center border shadow-sm space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto text-2xl">
            📊
          </div>
          <h3 className="text-lg font-bold text-gray-700">No Exam Selected</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Please choose an exam from the dropdown above to view student submission records and grade subjective questions.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default TeacherResults;
