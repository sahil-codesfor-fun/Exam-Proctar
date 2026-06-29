import * as XLSX from 'xlsx';

/**
 * Export exam results as CSV file and trigger download
 */
export function exportResultsAsCSV(results, examTitle) {
  const rows = results.map((r, i) => ({
    'Rank': i + 1,
    'Student Name': r.studentName,
    'Roll Number': r.studentRollNo,
    'Email': r.studentEmail,
    'Department': r.studentDepartment || '—',
    'Marks Obtained': r.totalScore,
    'Maximum Marks': r.maxScore,
    'Percentage (%)': r.percentage,
    'Correct': r.correct,
    'Wrong': r.wrong,
    'Partial': r.partial,
    'Skipped': r.skipped,
    'Total Questions': r.totalQuestions,
    'Infractions': r.violationCount,
    'Status': r.status?.replace('_', ' ') || '—',
    'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');

  const fileName = `${examTitle.replace(/[^a-zA-Z0-9]/g, '_')}_results.csv`;
  XLSX.writeFile(wb, fileName, { bookType: 'csv' });
}

/**
 * Export exam results as Excel file and trigger download
 */
export function exportResultsAsExcel(results, examTitle) {
  const rows = results.map((r, i) => ({
    'Rank': i + 1,
    'Student Name': r.studentName,
    'Roll Number': r.studentRollNo,
    'Email': r.studentEmail,
    'Department': r.studentDepartment || '—',
    'Marks Obtained': r.totalScore,
    'Maximum Marks': r.maxScore,
    'Percentage (%)': r.percentage,
    'Correct': r.correct,
    'Wrong': r.wrong,
    'Partial': r.partial,
    'Skipped': r.skipped,
    'Total Questions': r.totalQuestions,
    'Infractions': r.violationCount,
    'Status': r.status?.replace('_', ' ') || '—',
    'Submitted At': r.submittedAt ? new Date(r.submittedAt).toLocaleString() : '—'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map(key => ({
    wch: Math.max(key.length, ...rows.map(r => String(r[key] ?? '').length)) + 2
  }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Results');

  const fileName = `${examTitle.replace(/[^a-zA-Z0-9]/g, '_')}_results.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export a single student's detailed report as Excel
 */
export function exportStudentReportAsExcel(report) {
  const studentName = report.student?.name || 'Student';
  const examName = report.exam?.name || 'Exam';

  // Summary sheet
  const summaryRows = [
    { 'Field': 'Student Name', 'Value': report.student.name },
    { 'Field': 'Roll Number', 'Value': report.student.rollNumber },
    { 'Field': 'Email', 'Value': report.student.email },
    { 'Field': 'Department', 'Value': report.student.department },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Exam Name', 'Value': report.exam.name },
    { 'Field': 'Subject', 'Value': report.exam.subject },
    { 'Field': 'Faculty', 'Value': report.exam.faculty },
    { 'Field': 'Duration', 'Value': `${report.exam.duration} minutes` },
    { 'Field': 'Status', 'Value': report.exam.submissionStatus },
    { 'Field': '', 'Value': '' },
    { 'Field': 'Maximum Marks', 'Value': report.performance.maxMarks },
    { 'Field': 'Marks Obtained', 'Value': report.performance.marksObtained },
    { 'Field': 'Percentage', 'Value': `${report.performance.percentage}%` },
    { 'Field': 'Correct', 'Value': report.performance.correct },
    { 'Field': 'Wrong', 'Value': report.performance.wrong },
    { 'Field': 'Partial', 'Value': report.performance.partial },
    { 'Field': 'Skipped', 'Value': report.performance.skipped },
    { 'Field': 'Infractions', 'Value': report.performance.infractions },
  ];

  // Questions sheet
  const questionRows = (report.questions || []).map(q => ({
    'Q#': `Q${q.questionNumber}`,
    'Type': q.type?.toUpperCase(),
    'Title': q.title,
    'Max Marks': q.maxMarks,
    'Obtained': q.obtainedMarks,
    'Status': q.status
  }));

  const wb = XLSX.utils.book_new();

  const ws1 = XLSX.utils.json_to_sheet(summaryRows);
  ws1['!cols'] = [{ wch: 20 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

  if (questionRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(questionRows);
    ws2['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws2, 'Questions');
  }

  const fileName = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${examName.replace(/[^a-zA-Z0-9]/g, '_')}_report.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export a single student's detailed report as CSV
 */
export function exportStudentReportAsCSV(report) {
  const studentName = report.student?.name || 'Student';
  const examName = report.exam?.name || 'Exam';

  const rows = (report.questions || []).map(q => ({
    'Question': `Q${q.questionNumber}`,
    'Type': q.type?.toUpperCase(),
    'Title': q.title,
    'Max Marks': q.maxMarks,
    'Obtained': q.obtainedMarks,
    'Status': q.status,
    'Student Name': report.student.name,
    'Roll Number': report.student.rollNumber,
    'Exam': report.exam.name,
    'Total Score': report.performance.marksObtained,
    'Total Max': report.performance.maxMarks,
    'Percentage': report.performance.percentage
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');

  const fileName = `${studentName.replace(/[^a-zA-Z0-9]/g, '_')}_${examName.replace(/[^a-zA-Z0-9]/g, '_')}_report.csv`;
  XLSX.writeFile(wb, fileName, { bookType: 'csv' });
}
