import React from 'react';
import { User, BookOpen, BarChart3, ClipboardList, MessageSquare } from 'lucide-react';
import QuestionAccordion from './QuestionAccordion';

// ─── Skeleton Loader ─────────────────────────────────────────
const ReportSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="h-48 bg-gray-100 rounded-2xl" />
      <div className="h-48 bg-gray-100 rounded-2xl" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(8)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
    </div>
    <div className="h-64 bg-gray-100 rounded-2xl" />
  </div>
);

// ─── Stat Card ───────────────────────────────────────────────
const StatCard = ({ label, value, color = 'text-gray-900', bgColor = 'bg-gray-50', borderColor = 'border-gray-100', small = false }) => (
  <div className={`${bgColor} rounded-xl p-4 border ${borderColor} text-center transition-all hover:shadow-sm hover:-translate-y-0.5`}>
    <p className={`${small ? 'text-xl' : 'text-2xl'} font-black ${color} mb-1`}>{value}</p>
    <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.15em]">{label}</p>
  </div>
);

// ─── Section Header ──────────────────────────────────────────
const SectionHeader = ({ icon, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="bg-gray-100 p-2 rounded-lg text-gray-500 border border-gray-200">
      {icon}
    </div>
    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">{title}</h4>
  </div>
);

// ─── Info Row ────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex items-start justify-between py-1.5 border-b border-gray-50 last:border-0">
    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">{label}</span>
    <span className="text-xs font-bold text-gray-700 text-right ml-3">{value || '—'}</span>
  </div>
);

// ─── Student Report ──────────────────────────────────────────
const StudentReport = ({ report, loading }) => {
  if (loading) return <ReportSkeleton />;
  if (!report) return <div className="p-6 text-center text-gray-400 text-sm italic">No report data available.</div>;

  const perf = report.performance || {};
  const student = report.student || {};
  const exam = report.exam || {};

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* ─── Student & Exam Info (Two Cards) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Student Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <SectionHeader icon={<User size={16} />} title="Student Information" />
          <div className="space-y-0.5">
            <InfoRow label="Name" value={student.name} />
            <InfoRow label="Roll No" value={student.rollNumber} />
            <InfoRow label="Reg No" value={student.registrationNumber} />
            <InfoRow label="Email" value={student.email} />
            <InfoRow label="Department" value={student.department} />
            <InfoRow label="Semester" value={student.semester} />
            <InfoRow label="Section" value={student.section} />
            <InfoRow label="Batch" value={student.batch} />
          </div>
        </div>

        {/* Exam Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <SectionHeader icon={<BookOpen size={16} />} title="Exam Information" />
          <div className="space-y-0.5">
            <InfoRow label="Exam" value={exam.name} />
            <InfoRow label="Subject" value={exam.subject} />
            <InfoRow label="Faculty" value={exam.faculty} />
            <InfoRow label="Exam Date" value={exam.examDate ? new Date(exam.examDate).toLocaleDateString() : '—'} />
            <InfoRow label="Start" value={exam.startTime ? new Date(exam.startTime).toLocaleString() : '—'} />
            <InfoRow label="End" value={exam.endTime ? new Date(exam.endTime).toLocaleString() : '—'} />
            <InfoRow label="Duration" value={exam.duration ? `${exam.duration} min` : '—'} />
            <InfoRow label="Submitted" value={exam.submissionTime ? new Date(exam.submissionTime).toLocaleString() : '—'} />
            <InfoRow label="Auto Submit" value={exam.autoSubmitted ? 'Yes' : 'No'} />
            <InfoRow
              label="Status"
              value={
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                  exam.submissionStatus === 'submitted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                  exam.submissionStatus === 'auto_submitted' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                  exam.submissionStatus === 'force_submitted' ? 'bg-red-50 text-red-500 border border-red-100' :
                  'bg-blue-50 text-blue-600 border border-blue-100'
                }`}>
                  {(exam.submissionStatus || '—').replace('_', ' ')}
                </span>
              }
            />
          </div>
        </div>
      </div>

      {/* ─── Performance Summary ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <SectionHeader icon={<BarChart3 size={16} />} title="Performance Summary" />

        {/* Primary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <StatCard label="Maximum Marks" value={perf.maxMarks} />
          <StatCard
            label="Marks Obtained"
            value={perf.marksObtained}
            color={perf.marksObtained > 0 ? 'text-emerald-600' : 'text-gray-900'}
            bgColor="bg-emerald-50/30"
            borderColor="border-emerald-100"
          />
          <StatCard
            label="Percentage"
            value={`${perf.percentage}%`}
            color={perf.percentage >= 33.33 ? 'text-emerald-600' : 'text-red-500'}
            bgColor={perf.percentage >= 33.33 ? 'bg-emerald-50/30' : 'bg-red-50/30'}
            borderColor={perf.percentage >= 33.33 ? 'border-emerald-100' : 'border-red-100'}
          />
          <StatCard label="Questions" value={perf.totalQuestions} />
        </div>

        {/* Secondary stats */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          <StatCard label="Attempted" value={perf.attempted} small />
          <StatCard
            label="Correct"
            value={perf.correct}
            color="text-emerald-600"
            bgColor="bg-emerald-50/30"
            borderColor="border-emerald-100"
            small
          />
          <StatCard
            label="Wrong"
            value={perf.wrong}
            color="text-red-500"
            bgColor="bg-red-50/30"
            borderColor="border-red-100"
            small
          />
          <StatCard
            label="Partial"
            value={perf.partial}
            color="text-amber-600"
            bgColor="bg-amber-50/30"
            borderColor="border-amber-100"
            small
          />
          <StatCard
            label="Skipped"
            value={perf.skipped}
            color="text-gray-400"
            small
          />
          <StatCard
            label="Infractions"
            value={perf.infractions}
            color={perf.infractions > 0 ? 'text-red-500' : 'text-emerald-600'}
            bgColor={perf.infractions > 0 ? 'bg-red-50/30' : 'bg-gray-50'}
            borderColor={perf.infractions > 0 ? 'border-red-100' : 'border-gray-100'}
            small
          />
        </div>
      </div>

      {/* ─── Question-wise Marks ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <SectionHeader icon={<ClipboardList size={16} />} title="Question-wise Marks" />

        {(report.questions || []).length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-8">No question data available.</p>
        ) : (
          <div className="space-y-2">
            {report.questions.map((q, i) => (
              <QuestionAccordion key={q.questionId || i} question={q} />
            ))}
          </div>
        )}
      </div>

      {/* ─── Faculty Remarks ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <SectionHeader icon={<MessageSquare size={16} />} title="Faculty Remarks" />

        {report.facultyRemarks?.generalFeedback ? (
          <div className="space-y-3">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">General Feedback</p>
              <p className="text-sm text-gray-700">{report.facultyRemarks.generalFeedback}</p>
            </div>
            {report.facultyRemarks.recommendation && (
              <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Recommendation</p>
                <p className="text-sm text-gray-700">{report.facultyRemarks.recommendation}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic text-center py-6">No faculty remarks have been provided yet.</p>
        )}
      </div>
    </div>
  );
};

export default StudentReport;