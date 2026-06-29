import React, { useState, useRef, useCallback } from 'react';
import { ChevronDown, Download, Check, X, Minus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import StudentReport from './StudentReport';
import { downloadReportPDF } from './ReportPdfGenerator';

const statusConfig = {
  submitted: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Submitted' },
  auto_submitted: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Auto Submitted' },
  force_submitted: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', label: 'Force Submitted' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', label: 'In Progress' },
};

const StudentAccordionTable = ({ results, examId, examTitle }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [reportData, setReportData] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const reportCache = useRef({});

  const fetchReport = useCallback(async (submissionId) => {
    // Check cache first
    if (reportCache.current[submissionId]) {
      setReportData(prev => ({ ...prev, [submissionId]: reportCache.current[submissionId] }));
      return;
    }

    setLoadingId(submissionId);
    try {
      const res = await api.get(`/trainer/results/${examId}/${submissionId}`);
      const data = res.data.data;
      reportCache.current[submissionId] = data;
      setReportData(prev => ({ ...prev, [submissionId]: data }));
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setReportData(prev => ({ ...prev, [submissionId]: null }));
    } finally {
      setLoadingId(null);
    }
  }, [examId]);

  const toggleExpand = useCallback((submissionId) => {
    if (expandedId === submissionId) {
      setExpandedId(null);
    } else {
      setExpandedId(submissionId);
      if (!reportCache.current[submissionId]) {
        fetchReport(submissionId);
      }
    }
  }, [expandedId, fetchReport]);

  const handleQuickPDF = useCallback(async (e, result) => {
    e.stopPropagation();
    // Fetch report if not cached, then generate PDF
    let report = reportCache.current[result.submissionId];
    if (!report) {
      try {
        const res = await api.get(`/trainer/results/${examId}/${result.submissionId}`);
        report = res.data.data;
        reportCache.current[result.submissionId] = report;
      } catch (err) {
        console.error('Failed to fetch report for PDF:', err);
        return;
      }
    }
    downloadReportPDF(report);
  }, [examId]);

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-4xl opacity-20 mb-3">📋</div>
        <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">No records in the vault.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      {/* Table Header */}
      <div className="bg-gray-50/80 border-b border-gray-200 hidden lg:block">
        <div className="grid grid-cols-[32px_1fr_80px_120px_80px_60px_60px_60px_60px_60px_80px_80px_48px] gap-0 text-[9px] font-black text-gray-400 uppercase tracking-widest py-3 px-4">
          <div></div>
          <div className="px-2">Student</div>
          <div className="px-2">Roll No</div>
          <div className="px-2">Exam</div>
          <div className="px-2 text-center">Marks</div>
          <div className="px-2 text-center">%</div>
          <div className="px-2 text-center">✓</div>
          <div className="px-2 text-center">✗</div>
          <div className="px-2 text-center">~</div>
          <div className="px-2 text-center">—</div>
          <div className="px-2 text-center">Infr.</div>
          <div className="px-2 text-center">Status</div>
          <div className="px-2 text-center">
            <Download size={10} />
          </div>
        </div>
      </div>

      {/* Student Rows */}
      <div className="divide-y divide-gray-100">
        {results.map((r) => {
          const isExpanded = expandedId === r.submissionId;
          const isLoading = loadingId === r.submissionId;
          const config = statusConfig[r.status] || statusConfig.in_progress;

          return (
            <div key={r.submissionId} className="bg-white">
              {/* ─── Desktop Row ─── */}
              <div
                onClick={() => toggleExpand(r.submissionId)}
                className={`hidden lg:grid grid-cols-[32px_1fr_80px_120px_80px_60px_60px_60px_60px_60px_80px_80px_48px] gap-0 items-center py-3 px-4 cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-gray-50 border-l-2 border-l-[#4B775E]' : 'hover:bg-gray-50/50 border-l-2 border-l-transparent'}`}
              >
                {/* Chevron */}
                <div>
                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#4B775E]' : ''}`}
                  />
                </div>

                {/* Student */}
                <div className="px-2 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{r.studentName}</p>
                  <p className="text-[10px] text-gray-400 font-mono truncate">{r.studentEmail}</p>
                </div>

                {/* Roll No */}
                <div className="px-2 text-xs font-bold text-gray-500 truncate">{r.studentRollNo}</div>

                {/* Exam */}
                <div className="px-2 text-xs font-medium text-gray-500 truncate">{r.examTitle}</div>

                {/* Marks */}
                <div className="px-2 text-center">
                  <span className="font-black text-sm text-gray-700">{r.totalScore}</span>
                  <span className="text-gray-300 mx-0.5">/</span>
                  <span className="text-xs text-gray-400">{r.maxScore}</span>
                </div>

                {/* Percentage */}
                <div className="px-2 text-center">
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${r.percentage >= 33.33 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {r.percentage}%
                  </span>
                </div>

                {/* Correct */}
                <div className="px-2 text-center">
                  <span className="text-xs font-black text-emerald-600">{r.correct}</span>
                </div>

                {/* Wrong */}
                <div className="px-2 text-center">
                  <span className="text-xs font-black text-red-500">{r.wrong}</span>
                </div>

                {/* Partial */}
                <div className="px-2 text-center">
                  <span className="text-xs font-black text-amber-600">{r.partial}</span>
                </div>

                {/* Skipped */}
                <div className="px-2 text-center">
                  <span className="text-xs font-black text-gray-400">{r.skipped}</span>
                </div>

                {/* Infractions */}
                <div className="px-2 text-center">
                  <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${r.violationCount > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-400'}`}>
                    {r.violationCount}
                  </span>
                </div>

                {/* Status */}
                <div className="px-2 text-center">
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
                    {config.label}
                  </span>
                </div>

                {/* Download */}
                <div className="px-2 text-center" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleQuickPDF(e, r)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>

              {/* ─── Mobile/Tablet Card ─── */}
              <div
                onClick={() => toggleExpand(r.submissionId)}
                className={`lg:hidden p-4 cursor-pointer transition-all duration-200 ${isExpanded ? 'bg-gray-50 border-l-2 border-l-[#4B775E]' : 'hover:bg-gray-50/50 border-l-2 border-l-transparent'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      size={14}
                      className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#4B775E]' : ''}`}
                    />
                    <div>
                      <p className="font-bold text-sm text-gray-900">{r.studentName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{r.studentRollNo}</p>
                    </div>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
                    {config.label}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap mt-2">
                  <div className="flex items-center gap-1">
                    <span className="font-black text-sm text-gray-700">{r.totalScore}</span>
                    <span className="text-gray-300">/</span>
                    <span className="text-xs text-gray-400">{r.maxScore}</span>
                  </div>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${r.percentage >= 33.33 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                    {r.percentage}%
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-black">
                    <span className="text-emerald-600">{r.correct}✓</span>
                    <span className="text-red-500">{r.wrong}✗</span>
                    <span className="text-amber-600">{r.partial}~</span>
                    <span className="text-gray-400">{r.skipped}—</span>
                  </div>
                  {r.violationCount > 0 && (
                    <span className="text-[10px] font-black text-red-500">{r.violationCount} infractions</span>
                  )}
                </div>
              </div>

              {/* ─── Expanded Report ─── */}
              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}
              >
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50/30">
                    <StudentReport
                      report={reportData[r.submissionId]}
                      loading={isLoading}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StudentAccordionTable;
