import React, { useState, useEffect } from 'react';
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
        {Array.isArray(opts) && opts.map((opt, i) => {
          const isSelected = typeof opt === 'object' && opt !== null ? !!opt.isSelected : false;
          const isCorrect = typeof opt === 'object' && opt !== null ? !!opt.isCorrect : false;
          const text = typeof opt === 'string' ? opt : (opt?.text ?? opt?.label ?? opt?.value ?? `Option ${i + 1}`);
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
            <div key={opt?.id || i} className={`flex items-center justify-between p-3 rounded-xl border ${ring} transition-all`}>
              <div className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border ${isCorrect ? 'border-emerald-400 text-emerald-600 bg-emerald-50' : isSelected ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-200 text-gray-400 bg-white'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm text-gray-700 font-medium">{text}</span>
              </div>
              {badge}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Awarded:</span>
        <span className={`text-sm font-black ${(question.obtainedMarks || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks ?? 0} / {question.maxMarks ?? 0}
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
            <p className="text-xs text-gray-500 font-mono">{String(d.constraints)}</p>
          </div>
        )}
      </div>

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

      {Array.isArray(d.testCases) && d.testCases.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Test Cases ({d.testCases.length})</p>
          <div className="grid gap-2">
            {d.testCases.map((tc, i) => {
              const inStr = String(tc?.input ?? '');
              const outStr = String(tc?.expectedOutput ?? '');
              return (
                <div key={tc?.id || i} className={`flex items-center justify-between p-3 rounded-xl border ${tc?.passed ? 'bg-emerald-50/30 border-emerald-100' : tc?.passed === false ? 'bg-red-50/30 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center ${tc?.passed ? 'bg-emerald-500 text-white' : tc?.passed === false ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {tc?.passed ? <Check size={10} strokeWidth={3} /> : tc?.passed === false ? <X size={10} strokeWidth={3} /> : <Minus size={10} />}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      TC {i + 1} {tc?.isHidden ? '(Hidden)' : ''}
                    </span>
                  </div>
                  {!tc?.isHidden && (
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 font-mono">
                      <span>In: {inStr.substring(0, 30)}{inStr.length > 30 ? '…' : ''}</span>
                      <span>Out: {outStr.substring(0, 30)}{outStr.length > 30 ? '…' : ''}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100 flex-wrap">
        {d.runtime && <span className="text-[10px] font-bold text-gray-400">Runtime: <span className="text-gray-600">{String(d.runtime)}</span></span>}
        {d.memoryUsage && <span className="text-[10px] font-bold text-gray-400">Memory: <span className="text-gray-600">{String(d.memoryUsage)}</span></span>}
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks:</span>
        <span className={`text-sm font-black ${(question.obtainedMarks || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks ?? 0} / {question.maxMarks ?? 0}
        </span>
      </div>
    </div>
  );
};

// ─── Subjective Detail ───────────────────────────────────────
const SubjectiveDetail = ({ question, onGradeUpdate }) => {
  const d = question.details || {};
  const charCount = (d.textAnswer || '').length;
  const wordCount = (d.textAnswer || '').trim().split(/\s+/).filter(Boolean).length;

  const [score, setScore] = useState(question.obtainedMarks || 0);
  const [remarks, setRemarks] = useState(d?.facultyRemarks || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setScore(question.obtainedMarks || 0);
    setRemarks(d?.facultyRemarks || '');
  }, [question.obtainedMarks, d?.facultyRemarks]);

  const handleSaveGrade = async () => {
    if (!onGradeUpdate) return;
    setSaving(true);
    setSaved(false);
    try {
      const validScore = Math.max(0, Math.min(Number(score) || 0, question.maxMarks || 10));
      await onGradeUpdate(question.questionId, validScore, remarks);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Failed to grade:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Question</p>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.description || question.title}</p>
        </div>
        <span className="bg-gray-200 text-gray-700 text-[10px] font-bold px-2.5 py-1 rounded-md shrink-0 ml-3">
          Max: {question.maxMarks} pts
        </span>
      </div>

      <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100 space-y-2">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Student Response</p>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${charCount >= 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              Characters: {charCount} / 5 {charCount >= 5 ? '(✓ Target Met)' : '(Min 5)'}
            </span>
            <span className="text-[10px] font-medium text-gray-400">
              ({wordCount} words)
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
          {d.textAnswer || <span className="italic text-gray-400">No answer submitted</span>}
        </p>
      </div>

      {onGradeUpdate ? (
        <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Teacher Manual Evaluation</p>
            {saved && <span className="text-xs font-bold text-emerald-600 animate-pulse">✓ Saved!</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
            <label className="flex flex-col gap-1 text-xs font-bold text-gray-700 sm:col-span-1">
              <span>Marks (0 to {question.maxMarks})</span>
              <input
                type="number"
                min="0"
                max={question.maxMarks}
                step="0.5"
                value={score}
                onChange={e => setScore(e.target.value)}
                className="px-3 py-2 bg-white rounded-lg border border-emerald-300 font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-bold text-gray-700 sm:col-span-2">
              <span>Faculty Remarks / Feedback</span>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Add evaluation feedback..."
                className="px-3 py-2 bg-white rounded-lg border border-emerald-300 font-medium text-gray-800 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveGrade}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg shadow-sm transition-all"
            >
              {saving ? 'Saving Grade...' : 'Save Evaluation'}
            </button>
          </div>
        </div>
      ) : (
        d.facultyRemarks && (
          <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Faculty Evaluation</p>
            <p className="text-sm text-gray-700">{d.facultyRemarks}</p>
          </div>
        )
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
  const correctPairs = Array.isArray(d.correctPairs) ? d.correctPairs : [];
  const studentMatches = (typeof d.studentMatches === 'object' && d.studentMatches !== null) ? d.studentMatches : {};

  return (
    <div className="space-y-3">
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question</p>
        <p className="text-sm text-gray-700 font-medium leading-relaxed">{question.description || question.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Correct Matches */}
        <div className="bg-emerald-50/30 rounded-xl p-4 border border-emerald-100">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Correct Matching</p>
          <div className="space-y-2">
            {correctPairs.map((pair, i) => (
              <div key={pair?.id || i} className="flex items-center gap-2 text-sm">
                <span className="bg-white px-2 py-1 rounded-lg border border-emerald-200 font-medium text-gray-700 flex-1 text-center">{String(pair?.leftItem ?? '')}</span>
                <span className="text-emerald-400 font-bold">⇄</span>
                <span className="bg-white px-2 py-1 rounded-lg border border-emerald-200 font-medium text-gray-700 flex-1 text-center">{String(pair?.rightItem ?? '')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Student Matches */}
        <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3">Student Matching</p>
          <div className="space-y-2">
            {correctPairs.map((pair, i) => {
              const studentMatchedId = studentMatches[pair?.id];
              const isCorrect = studentMatchedId === pair?.id;
              const matchedRight = studentMatchedId ? (correctPairs.find(p => p?.id === studentMatchedId)?.rightItem ?? '—') : '—';
              return (
                <div key={pair?.id || i} className={`flex items-center gap-2 text-sm px-2 py-1 rounded-lg ${isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <span className="font-medium text-gray-700 flex-1 text-center">{String(pair?.leftItem ?? '')}</span>
                  <span className={`font-bold ${isCorrect ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="font-medium text-gray-700 flex-1 text-center">
                    {String(matchedRight)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Marks Awarded:</span>
        <span className={`text-sm font-black ${(question.obtainedMarks || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {question.obtainedMarks ?? 0} / {question.maxMarks ?? 0}
        </span>
      </div>
    </div>
  );
};

// ─── Main Question Accordion ─────────────────────────────────
const QuestionAccordion = ({ question, onGradeUpdate }) => {
  const [expanded, setExpanded] = useState(false);
  if (!question) return null;

  const qType = (question.type || 'mcq').toLowerCase();
  const config = statusConfig[question.status] || statusConfig.skipped;
  const typeIcon = typeIcons[qType] || <FileText size={14} />;

  return (
    <div className={`rounded-xl border ${expanded ? 'border-gray-300 shadow-sm' : 'border-gray-100 hover:border-gray-200'} transition-all duration-200 overflow-hidden`}>
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
            Q{question.questionNumber || 1}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${config.bg} ${config.text} border ${config.border}`}>
            {typeIcon}
            {qType}
          </span>
          <span className="text-sm font-medium text-gray-700 truncate">{question.title || 'Question'}</span>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs font-bold text-gray-400">{question.maxMarks ?? 0} pts</span>
          <span className={`text-sm font-black ${(question.obtainedMarks || 0) > 0 ? ((question.obtainedMarks || 0) >= (question.maxMarks || 0) ? 'text-emerald-600' : 'text-amber-600') : 'text-red-500'}`}>
            {question.obtainedMarks ?? 0}
          </span>
          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${config.bg} ${config.text} border ${config.border}`}>
            {config.icon}
            {config.label}
          </span>
        </div>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${expanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-4 pb-4 pt-1 border-t border-gray-100">
          {qType === 'mcq' && <MCQDetail question={question} />}
          {qType === 'coding' && <CodingDetail question={question} />}
          {qType === 'subjective' && <SubjectiveDetail question={question} onGradeUpdate={onGradeUpdate} />}
          {qType === 'matching' && <MatchingDetail question={question} />}
          {!['mcq', 'coding', 'subjective', 'matching'].includes(qType) && (
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
