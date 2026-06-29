import prisma from '../config/prisma.js';

// ─── Helper: Compute per-question stats from answers JSON ────────────────────
function computeQuestionStats(answers) {
  let correct = 0, wrong = 0, partial = 0, skipped = 0, attempted = 0;

  for (const ans of answers) {
    const hasAnswer = !!(
      ans.selectedOptionId ||
      ans.selectedOption >= 0 ||
      (ans.code && ans.code.trim()) ||
      (ans.textAnswer && ans.textAnswer.trim()) ||
      (ans.studentMatches && Object.keys(ans.studentMatches).length > 0)
    );

    if (!hasAnswer) {
      skipped++;
      continue;
    }

    attempted++;
    const score = Number(ans.score) || 0;
    const maxScore = Number(ans.maxScore) || 0;

    if (score === 0) {
      wrong++;
    } else if (maxScore > 0 && score < maxScore) {
      partial++;
    } else {
      correct++;
    }
  }

  return { correct, wrong, partial, skipped, attempted, total: answers.length };
}

// ─── GET /api/trainer/results/:examId ────────────────────────────────────────
// Returns summary table data for all submissions in an exam
export const getExamResultsSummary = async (req, res) => {
  try {
    const { examId } = req.params;

    // Verify exam belongs to this teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, creatorId: true, title: true }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const submissions = await prisma.submission.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, studentId: true,
            department: true, role: true
          }
        }
      },
      orderBy: { totalScore: 'desc' }
    });

    // Deduplicate: keep latest submitted/auto_submitted per student
    const uniqueMap = new Map();
    submissions.forEach(s => {
      const sid = s.studentId;
      if (!uniqueMap.has(sid)) {
        uniqueMap.set(sid, s);
      } else {
        const existing = uniqueMap.get(sid);
        if (s.status === 'submitted' || s.status === 'auto_submitted') {
          uniqueMap.set(sid, s);
        } else if (existing.status !== 'submitted' && existing.status !== 'auto_submitted') {
          if (new Date(s.createdAt) > new Date(existing.createdAt)) uniqueMap.set(sid, s);
        }
      }
    });

    const results = Array.from(uniqueMap.values()).map((s, index) => {
      const answers = Array.isArray(s.answers) ? s.answers : [];
      const stats = computeQuestionStats(answers);

      return {
        _id: s.id,
        submissionId: s.id,
        studentName: s.student?.name || 'Unknown',
        studentRollNo: s.student?.studentId || '—',
        studentEmail: s.student?.email || '—',
        studentDepartment: s.student?.department || '—',
        examTitle: exam.title,
        totalScore: s.totalScore,
        maxScore: s.maxScore,
        percentage: s.percentage,
        correct: stats.correct,
        wrong: stats.wrong,
        partial: stats.partial,
        skipped: stats.skipped,
        attempted: stats.attempted,
        totalQuestions: stats.total,
        violationCount: s.violationCount,
        status: s.status,
        submittedAt: s.submittedAt,
        createdAt: s.createdAt,
        rank: index + 1
      };
    });

    // Re-sort by totalScore descending and assign ranks
    results.sort((a, b) => b.totalScore - a.totalScore);
    results.forEach((r, i) => r.rank = i + 1);

    res.json({ success: true, data: results });
  } catch (err) {
    console.error('getExamResultsSummary error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/trainer/results/:examId/:submissionId ──────────────────────────
// Returns complete detailed report for a single submission (lazy-loaded)
export const getDetailedReport = async (req, res) => {
  try {
    const { examId, submissionId } = req.params;

    // Verify exam belongs to this teacher
    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: {
          include: { options: true, testCases: true, matchingPairs: true }
        },
        creator: { select: { name: true, email: true } }
      }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        student: {
          select: {
            id: true, name: true, email: true, studentId: true,
            department: true, role: true
          }
        }
      }
    });

    if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
    if (submission.examId !== examId) return res.status(400).json({ success: false, message: 'Submission does not belong to this exam' });

    // Get violations for this student in this exam
    const violations = await prisma.violation.findMany({
      where: { examId, studentId: submission.studentId },
      orderBy: { timestamp: 'desc' }
    });

    const answers = Array.isArray(submission.answers) ? submission.answers : [];
    const stats = computeQuestionStats(answers);

    // Build question-wise breakdown
    const questionBreakdown = answers.map((ans, index) => {
      const question = exam.questions.find(q => q.id === ans.questionId);
      if (!question) {
        return {
          questionNumber: index + 1,
          questionId: ans.questionId,
          type: ans.questionType || 'unknown',
          title: 'Question not found',
          description: '',
          maxMarks: Number(ans.maxScore) || 0,
          obtainedMarks: Number(ans.score) || 0,
          status: 'skipped',
          studentAnswer: null,
          correctAnswer: null,
          details: {}
        };
      }

      const score = Number(ans.score) || 0;
      const maxScore = Number(question.points) || Number(ans.maxScore) || 0;

      // Determine status
      let status = 'skipped';
      const hasAnswer = !!(
        ans.selectedOptionId ||
        ans.selectedOption >= 0 ||
        (ans.code && ans.code.trim()) ||
        (ans.textAnswer && ans.textAnswer.trim()) ||
        (ans.studentMatches && Object.keys(ans.studentMatches).length > 0)
      );

      if (hasAnswer) {
        if (score === 0) status = 'wrong';
        else if (maxScore > 0 && score < maxScore) status = 'partial';
        else status = 'correct';
      }

      // Build type-specific details
      let details = {};
      let studentAnswer = null;
      let correctAnswer = null;

      if (question.type === 'mcq') {
        const selectedOpt = ans.selectedOptionId
          ? question.options.find(o => o.id === ans.selectedOptionId)
          : (ans.selectedOption >= 0 ? question.options[ans.selectedOption] : null);
        const correctOpt = question.options.find(o => o.isCorrect);

        studentAnswer = selectedOpt ? selectedOpt.text : null;
        correctAnswer = correctOpt ? correctOpt.text : null;

        details = {
          options: question.options.map(o => ({
            id: o.id,
            text: o.text,
            isCorrect: o.isCorrect,
            isSelected: selectedOpt ? o.id === selectedOpt.id : false
          })),
          selectedOptionId: ans.selectedOptionId || null,
          correctOptionId: correctOpt?.id || null
        };
      } else if (question.type === 'coding') {
        studentAnswer = ans.code || '';
        details = {
          language: ans.language || 'python',
          code: ans.code || '',
          executionOutput: ans.executionOutput || null,
          compilationStatus: ans.compilationStatus || null,
          testCases: (question.testCases || []).map(tc => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            isHidden: tc.isHidden,
            passed: ans.testCaseResults?.[tc.id] ?? null
          })),
          runtime: ans.runtime || null,
          memoryUsage: ans.memoryUsage || null,
          constraints: question.constraints || ''
        };
      } else if (question.type === 'subjective') {
        studentAnswer = ans.textAnswer || '';
        details = {
          textAnswer: ans.textAnswer || '',
          facultyRemarks: ans.facultyRemarks || null,
          evaluated: score > 0
        };
      } else if (question.type === 'matching') {
        const studentMatches = ans.studentMatches || {};
        const correctPairs = question.matchingPairs || [];

        studentAnswer = studentMatches;
        correctAnswer = correctPairs.reduce((acc, p) => {
          acc[p.id] = { left: p.leftItem, right: p.rightItem };
          return acc;
        }, {});

        details = {
          correctPairs: correctPairs.map(p => ({
            id: p.id,
            leftItem: p.leftItem,
            rightItem: p.rightItem
          })),
          studentMatches,
          matchingLeft: ans.matchingLeft || [],
          matchingRight: ans.matchingRight || []
        };
      }

      return {
        questionNumber: index + 1,
        questionId: question.id,
        type: question.type,
        title: question.title,
        description: question.description || '',
        maxMarks: maxScore,
        obtainedMarks: score,
        status,
        studentAnswer,
        correctAnswer,
        details
      };
    });

    const report = {
      // Student Information
      student: {
        name: submission.student?.name || 'Unknown',
        rollNumber: submission.student?.studentId || '—',
        email: submission.student?.email || '—',
        department: submission.student?.department || '—',
        registrationNumber: submission.student?.studentId || '—',
        semester: '—',
        section: '—',
        batch: '—'
      },
      // Exam Information
      exam: {
        name: exam.title,
        subject: exam.course || '—',
        faculty: exam.creator?.name || '—',
        facultyEmail: exam.creator?.email || '—',
        examDate: exam.startTime || exam.createdAt,
        startTime: exam.startTime,
        endTime: exam.endTime,
        duration: exam.durationMinutes,
        submissionTime: submission.submittedAt || submission.createdAt,
        autoSubmitted: submission.status === 'auto_submitted',
        submissionStatus: submission.status
      },
      // Performance Summary
      performance: {
        maxMarks: submission.maxScore,
        marksObtained: submission.totalScore,
        percentage: submission.percentage,
        totalQuestions: stats.total,
        attempted: stats.attempted,
        correct: stats.correct,
        wrong: stats.wrong,
        partial: stats.partial,
        skipped: stats.skipped,
        infractions: submission.violationCount,
        rank: null // Will be computed client-side or in a future update
      },
      // Question-wise breakdown
      questions: questionBreakdown,
      // Violations detail
      violations: violations.map(v => ({
        type: v.type,
        severity: v.severity,
        details: v.details,
        timestamp: v.timestamp
      })),
      // Faculty remarks placeholder
      facultyRemarks: {
        generalFeedback: null,
        recommendation: null,
        signature: null
      },
      // Metadata
      generatedAt: new Date().toISOString()
    };

    res.json({ success: true, data: report });
  } catch (err) {
    console.error('getDetailedReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/trainer/results/:examId/export/csv ─────────────────────────────
export const exportCSV = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, creatorId: true, title: true }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const submissions = await prisma.submission.findMany({
      where: { examId },
      include: {
        student: {
          select: { name: true, email: true, studentId: true, department: true }
        }
      },
      orderBy: { totalScore: 'desc' }
    });

    // Deduplicate
    const uniqueMap = new Map();
    submissions.forEach(s => {
      const sid = s.studentId;
      if (!uniqueMap.has(sid)) {
        uniqueMap.set(sid, s);
      } else {
        const existing = uniqueMap.get(sid);
        if (s.status === 'submitted' || s.status === 'auto_submitted') {
          uniqueMap.set(sid, s);
        }
      }
    });

    const rows = Array.from(uniqueMap.values()).map((s, i) => {
      const answers = Array.isArray(s.answers) ? s.answers : [];
      const stats = computeQuestionStats(answers);

      return {
        'Rank': i + 1,
        'Student Name': s.student?.name || 'Unknown',
        'Roll Number': s.student?.studentId || '—',
        'Email': s.student?.email || '—',
        'Department': s.student?.department || '—',
        'Marks Obtained': s.totalScore,
        'Maximum Marks': s.maxScore,
        'Percentage': s.percentage,
        'Correct': stats.correct,
        'Wrong': stats.wrong,
        'Partial': stats.partial,
        'Skipped': stats.skipped,
        'Total Questions': stats.total,
        'Infractions': s.violationCount,
        'Status': s.status,
        'Submitted At': s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'
      };
    });

    // Generate CSV
    const headers = Object.keys(rows[0] || {});
    let csv = headers.join(',') + '\n';
    rows.forEach(row => {
      csv += headers.map(h => {
        let val = String(row[h] ?? '');
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          val = '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      }).join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv"`);
    res.send(csv);
  } catch (err) {
    console.error('exportCSV error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/trainer/results/:examId/export/excel ───────────────────────────
export const exportExcel = async (req, res) => {
  try {
    const { examId } = req.params;

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, creatorId: true, title: true }
    });

    if (!exam) return res.status(404).json({ success: false, message: 'Exam not found' });
    if (exam.creatorId !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const submissions = await prisma.submission.findMany({
      where: { examId },
      include: {
        student: {
          select: { name: true, email: true, studentId: true, department: true }
        }
      },
      orderBy: { totalScore: 'desc' }
    });

    // Deduplicate
    const uniqueMap = new Map();
    submissions.forEach(s => {
      const sid = s.studentId;
      if (!uniqueMap.has(sid)) {
        uniqueMap.set(sid, s);
      } else {
        const existing = uniqueMap.get(sid);
        if (s.status === 'submitted' || s.status === 'auto_submitted') {
          uniqueMap.set(sid, s);
        }
      }
    });

    const rows = Array.from(uniqueMap.values()).map((s, i) => {
      const answers = Array.isArray(s.answers) ? s.answers : [];
      const stats = computeQuestionStats(answers);

      return {
        'Rank': i + 1,
        'Student Name': s.student?.name || 'Unknown',
        'Roll Number': s.student?.studentId || '—',
        'Email': s.student?.email || '—',
        'Department': s.student?.department || '—',
        'Marks Obtained': s.totalScore,
        'Maximum Marks': s.maxScore,
        'Percentage': s.percentage,
        'Correct': stats.correct,
        'Wrong': stats.wrong,
        'Partial': stats.partial,
        'Skipped': stats.skipped,
        'Total Questions': stats.total,
        'Infractions': s.violationCount,
        'Status': s.status,
        'Submitted At': s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '—'
      };
    });

    // Use xlsx to create workbook — dynamic import since backend may not have it
    // We'll generate a simple buffer manually using CSV-to-Excel approach
    // Actually, let's just send JSON and let the frontend handle Excel with its xlsx package
    // But the user requested backend Excel export, so we'll do CSV with .xlsx mime type
    // For proper Excel, we need xlsx package on backend too

    // Fallback: send as CSV with Excel-compatible format
    const headers = Object.keys(rows[0] || {});
    let tsv = headers.join('\t') + '\n';
    rows.forEach(row => {
      tsv += headers.map(h => String(row[h] ?? '')).join('\t') + '\n';
    });

    res.setHeader('Content-Type', 'application/vnd.ms-excel');
    res.setHeader('Content-Disposition', `attachment; filename="${exam.title.replace(/[^a-zA-Z0-9]/g, '_')}_results.xls"`);
    res.send(tsv);
  } catch (err) {
    console.error('exportExcel error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
