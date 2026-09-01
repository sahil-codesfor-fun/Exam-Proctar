import React from 'react';
import { BarChart3, ClipboardList } from 'lucide-react';
import QuestionAccordion from './QuestionAccordion';

// ─── Skeleton Loader ─────────────────────────────────────────
const ReportSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
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

// ─── Student Report ──────────────────────────────────────────
const StudentReport = ({ report, loading, onGradeUpdate }) => {
  if (loading) return <ReportSkeleton />;
  if (!report) return <div className="p-6 text-center text-gray-400 text-sm italic">No report data available.</div>;

  const perf = report.performance || {};

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* ─── Performance Summary ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <SectionHeader icon={<BarChart3 size={16} />} title="Performance Summary" />

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
              <QuestionAccordion key={q.questionId || i} question={q} onGradeUpdate={onGradeUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentReport;

