import React, { useState } from 'react';
import { ChevronDown, Check, X, Minus, AlertCircle, Code2, FileText, Link2, PenLine } from 'lucide-react';

const statusConfig = {
  correct: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Correct', icon: <Check size={12} strokeWidth={3} /> },
  wrong: { bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-100', label: 'Wrong', icon: <X size={12} strokeWidth={3} /> },
  partial: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Partial', icon: <Minus size={12} strokeWidth={3} /> },
  skipped: { bg: 'bg-gray-50', text: 'text-gray-400', border: 'border-gray-200', label: 'Skipped', icon: <AlertCircle size={12} /> },
};

const typeIcons = {
  mcq: <FileText size={14} />,
  coding: <Code2 size={14} />,
  matching: <Link2 size={14} />,
  subjective: <PenLine size={14} />,
};

// ─── MCQ Detail ──────────────────────────────────────────────
const MCQDetail = ({ question }) => {
  const opts = question.details?.options || [];
  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.description || question.title}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {opts.map((opt, i) => {
          const isSelected = opt.isSelected;
          const isCorrect = opt.isCorrect;
          let ring = 'border-gray-200 bg-white';
          let badge = null;

          if (isCorrect && isSelected) {
            ring = 'border-emerald-400 bg-emerald-50/50';
            badge = <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-md uppercase tracking-wider">✓ Correct</span>;
          } else if (isCorrect) {
            ring = 'border-emerald-300 bg-emerald-50/30';
            badge = <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md uppercase tracking-wider">Answer</span>;
          } else if (isSelected) {
            ring = 'border-red-300 bg-red-50/30';
            badge = <span className="text-[8px] font-black bg-red-100 text-red-500 px-2 py-0.5 rounded-md uppercase tracking-wider">Selected</span>;
          }

          return (
            <div key={opt.id || i} className={`flex items-center justify-between p-3 rounded-xl border ${ring} transition-all`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${isCorrect ? 'border-emerald-400 text-emerald-600 bg-emerald-50' : isSelected ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 bg-white'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-gray-700 font-medium">{opt.text}</span>
              </div>
              {badge}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Awarded:</span>
        <span className={`text-sm font-black ${question.obtainedMarks > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks} / {question.maxMarks}
        </span>
      </div>
    </div>
  );
};

// ─── Coding Detail ───────────────────────────────────────────
const CodingDetail = ({ question }) => {
  const d = question.details || {};
  const [showCode, setShowCode] = useState(true);

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Problem Statement</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">{question.description || question.title}</p>
        {d.constraints && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Constraints</p>
            <p className="text-xs text-gray-500 font-mono">{d.constraints}</p>
          </div>
        )}
      </div>

      {/* Language + Code */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{d.language || 'python'}</span>
          </div>
          <button onClick={() => setShowCode(!showCode)} className="text-[10px] font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-wider">
            {showCode ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {showCode && (
          <pre className="p-4 text-xs text-gray-300 font-mono overflow-x-auto max-h-80 leading-relaxed">
            <code>{d.code || '// No code submitted'}</code>
          </pre>
        )}
      </div>

      {/* Test Cases */}
      {d.testCases && d.testCases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Cases ({d.testCases.length})</p>
          <div className="grid gap-2">
            {d.testCases.map((tc, i) => (
              <div key={tc.id || i} className={`flex items-center justify-between p-3 rounded-xl border ${tc.passed ? 'bg-emerald-50/30 border-emerald-100' : tc.passed === false ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center ${tc.passed ? 'bg-emerald-500 text-white' : tc.passed === false ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    {tc.passed ? <Check size={10} strokeWidth={3} /> : tc.passed === false ? <X size={10} strokeWidth={3} /> : <Minus size={10} />}
                  </span>
                  <span className="text-xs font-bold text-gray-600">
                    TC {i + 1} {tc.isHidden ? '(Hidden)' : ''}
                  </span>
                </div>
                {!tc.isHidden && (
                  <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                    <span>In: {tc.input?.substring(0, 30)}{tc.input?.length > 30 ? '…' : ''}</span>
                    <span>Out: {tc.expectedOutput?.substring(0, 30)}{tc.expectedOutput?.length > 30 ? '…' : ''}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Execution Stats */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 flex-wrap">
        {d.runtime && <span className="text-[10px] font-bold text-gray-400">Runtime: <span className="text-gray-600">{d.runtime}</span></span>}
        {d.memoryUsage && <span className="text-[10px] font-bold text-gray-400">Memory: <span className="text-gray-600">{d.memoryUsage}</span></span>}
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks:</span>
        <span className={`text-sm font-black ${question.obtainedMarks > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks} / {question.maxMarks}
        </span>
      </div>
    </div>
  );
};

// ─── Subjective Detail ───────────────────────────────────────
const SubjectiveDetail = ({ question }) => {
  const d = question.details || {};

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.description || question.title}</p>
      </div>

      <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2">Student Answer</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
          {d.textAnswer || <span className="italic text-gray-400">No answer submitted</span>}
        </p>
      </div>

      {d.facultyRemarks && (
        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Faculty Evaluation</p>
          <p className="text-sm text-gray-700">{d.facultyRemarks}</p>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Awarded:</span>
        <span className={`text-sm font-black ${question.obtainedMarks > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks} / {question.maxMarks}
        </span>
      </div>
    </div>
  );
};

// ─── Matching Detail ─────────────────────────────────────────
const MatchingDetail = ({ question }) => {
  const d = question.details || {};
  const correctPairs = d.correctPairs || [];
  const studentMatches = d.studentMatches || {};

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.description || question.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correct Matching */}
        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Correct Matching</p>
          <div className="space-y-2">
            {correctPairs.map((pair, i) => (
              <div key={pair.id || i} className="flex items-center gap-2 text-sm">
                <span className="bg-white px-2 py-1 rounded-lg border border-emerald-200 font-medium text-gray-700 flex-1 text-center">{pair.leftItem}</span>
                <span className="text-emerald-400 font-bold">⇄</span>
                <span className="bg-white px-2 py-1 rounded-lg border border-emerald-200 font-medium text-gray-700 flex-1 text-center">{pair.rightItem}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Matching */}
        <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Student Matching</p>
          <div className="space-y-2">
            {correctPairs.map((pair, i) => {
              const studentMatchedId = studentMatches[pair.id];
              const isCorrect = studentMatchedId === pair.id;
              return (
                <div key={pair.id || i} className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="font-medium text-gray-700 flex-1 text-center">{pair.leftItem}</span>
                  <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-gray-700 flex-1 text-center">
                    {studentMatchedId ? (correctPairs.find(p => p.id === studentMatchedId)?.rightItem || '—') : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Awarded:</span>
        <span className={`text-sm font-black ${question.obtainedMarks > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks} / {question.maxMarks}
        </span>
      </div>
    </div>
  );
};

// ─── Main Question Accordion ─────────────────────────────────
const QuestionAccordion = ({ question }) => {
  const [expanded, setExpanded] = useState(false);
  const config = statusConfig[question.status] || statusConfig.skipped;
  const typeIcon = typeIcons[question.type] || <FileText size={14} />;

  return (
    <div className={`rounded-xl border ${expanded ? 'border-gray-300 shadow-sm' : 'border-gray-100 hover:border-gray-200'} transition-all duration-200 overflow-hidden`}>
      {/* Header Row */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <ChevronDown
            size={14}
            className={`text-gray-400 transition-transform duration-200 shrink-0 ${expanded ? 'rotate-180' : ''}`}
          />
          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md text-[10px] font-black shrink-0">
            Q{question.questionNumber}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${config.bg} ${config.text} border ${config.border}`}>
            {typeIcon}
            {question.type}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">{question.title}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs font-bold text-gray-400">{question.maxMarks} pts</span>
          <span className={`text-sm font-black ${question.obtainedMarks > 0 ? (question.obtainedMarks >= question.maxMarks ? 'text-emerald-600' : 'text-amber-600') : 'text-red-500'}`}>
            {question.obtainedMarks}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {question.type === 'mcq' && <MCQDetail question={question} />}
          {question.type === 'coding' && <CodingDetail question={question} />}
          {question.type === 'subjective' && <SubjectiveDetail question={question} />}
          {question.type === 'matching' && <MatchingDetail question={question} />}
          {!['mcq', 'coding', 'subjective', 'matching'].includes(question.type) && (
            <div className="text-sm text-gray-500 italic py-2">
              Detailed view not available for this question type.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuestionAccordion;
