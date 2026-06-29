import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';



/**
 * Generate a professional marksheet PDF for a student's exam report
 */
export async function generateReportPDF(report) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // ─── Colors ──────────────────────────────────────────────────
  const brandGreen = [75, 119, 94];    // #4B775E
  const darkGray = [31, 41, 55];       // #1F2937
  const medGray = [107, 114, 128];     // #6B7280
  const lightGray = [243, 244, 246];   // #F3F4F6
  const white = [255, 255, 255];
  const correctGreen = [16, 185, 129]; // #10B981
  const wrongRed = [239, 68, 68];      // #EF4444
  const partialYellow = [245, 158, 11];// #F59E0B
  const skippedGray = [156, 163, 175]; // #9CA3AF

  // ─── Header ──────────────────────────────────────────────────
  doc.setFillColor(...brandGreen);
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('NEXUS PROCTOR', margin, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Examination Report', margin, 23);

  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 14, { align: 'right' });
  doc.text(`Report ID: ${Date.now().toString(36).toUpperCase()}`, pageWidth - margin, 21, { align: 'right' });

  y = 40;

  // ─── Title Bar ───────────────────────────────────────────────
  doc.setFillColor(...darkGray);
  doc.rect(margin, y, contentWidth, 10, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT EXAMINATION MARKSHEET', pageWidth / 2, y + 7, { align: 'center' });
  y += 16;

  // ─── Student & Exam Info (Two Columns) ───────────────────────
  const colWidth = (contentWidth - 6) / 2;

  // Student Info Box
  doc.setDrawColor(229, 231, 235);
  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, colWidth, 52, 2, 2, 'FD');

  doc.setTextColor(...brandGreen);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT INFORMATION', margin + 4, y + 7);

  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const studentFields = [
    ['Name', report.student?.name || '—'],
    ['Roll Number', report.student?.rollNumber || '—'],
    ['Email', report.student?.email || '—'],
    ['Department', report.student?.department || '—'],
    ['Reg. Number', report.student?.registrationNumber || '—'],
  ];
  studentFields.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...medGray);
    doc.text(`${label}:`, margin + 4, y + 14 + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(String(value || '—'), margin + 35, y + 14 + i * 7);
  });

  // Exam Info Box
  const examX = margin + colWidth + 6;
  doc.setFillColor(...lightGray);
  doc.roundedRect(examX, y, colWidth, 52, 2, 2, 'FD');

  doc.setTextColor(...brandGreen);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('EXAM INFORMATION', examX + 4, y + 7);

  doc.setTextColor(...darkGray);
  doc.setFontSize(8);
  const examFields = [
    ['Exam', report.exam?.name || '—'],
    ['Subject', report.exam?.subject || '—'],
    ['Faculty', report.exam?.faculty || '—'],
    ['Duration', report.exam?.duration ? `${report.exam.duration} min` : '—'],
    ['Status', report.exam?.submissionStatus?.replace('_', ' ')?.toUpperCase() || '—'],
  ];
  examFields.forEach(([label, value], i) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...medGray);
    doc.text(`${label}:`, examX + 4, y + 14 + i * 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(String(value || '—'), examX + 30, y + 14 + i * 7);
  });

  y += 58;

  // ─── Performance Summary ─────────────────────────────────────
  doc.setFillColor(...darkGray);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PERFORMANCE SUMMARY', margin + 4, y + 5.5);
  y += 12;

  // Score cards row
  const perf = report.performance || {};
  const cardW = (contentWidth - 12) / 4;

  const scoreCards = [
    { label: 'MARKS', value: `${perf.marksObtained || 0} / ${perf.maxMarks || 0}`, color: brandGreen },
    { label: 'PERCENTAGE', value: `${perf.percentage || 0}%`, color: (perf.percentage || 0) >= 33.33 ? correctGreen : wrongRed },
    { label: 'CORRECT', value: String(perf.correct || 0), color: correctGreen },
    { label: 'WRONG', value: String(perf.wrong || 0), color: wrongRed },
  ];

  scoreCards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(...lightGray);
    doc.roundedRect(cx, y, cardW, 18, 2, 2, 'F');

    doc.setTextColor(...card.color);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, cx + cardW / 2, y + 10, { align: 'center' });

    doc.setTextColor(...medGray);
    doc.setFontSize(6);
    doc.text(card.label, cx + cardW / 2, y + 15, { align: 'center' });
  });

  y += 22;

  // Secondary stats row
  const secCards = [
    { label: 'PARTIAL', value: String(perf.partial || 0), color: partialYellow },
    { label: 'SKIPPED', value: String(perf.skipped || 0), color: skippedGray },
    { label: 'ATTEMPTED', value: `${perf.attempted || 0}/${perf.totalQuestions || 0}`, color: darkGray },
    { label: 'INFRACTIONS', value: String(perf.infractions || 0), color: (perf.infractions || 0) > 0 ? wrongRed : correctGreen },
  ];

  secCards.forEach((card, i) => {
    const cx = margin + i * (cardW + 4);
    doc.setFillColor(...lightGray);
    doc.roundedRect(cx, y, cardW, 14, 2, 2, 'F');

    doc.setTextColor(...card.color);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, cx + cardW / 2, y + 7, { align: 'center' });

    doc.setTextColor(...medGray);
    doc.setFontSize(5);
    doc.text(card.label, cx + cardW / 2, y + 12, { align: 'center' });
  });

  y += 20;

  // ─── Question-wise Marks Table ───────────────────────────────
  doc.setFillColor(...darkGray);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setTextColor(...white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('QUESTION-WISE MARKS', margin + 4, y + 5.5);
  y += 10;

  const questions = report.questions || [];
  const tableBody = questions.map(q => {
    return [
      `Q${q.questionNumber || ''}`,
      q.type?.toUpperCase() || '—',
      q.title?.substring(0, 40) + (q.title?.length > 40 ? '…' : ''),
      String(q.maxMarks || 0),
      String(q.obtainedMarks || 0),
      q.status?.charAt(0).toUpperCase() + q.status?.slice(1) || '—'
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Q#', 'Type', 'Title', 'Max', 'Obtained', 'Status']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2.5,
      lineWidth: 0.1,
      lineColor: [229, 231, 235]
    },
    headStyles: {
      fillColor: brandGreen,
      textColor: white,
      fontStyle: 'bold',
      fontSize: 7
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 18 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 18 }
    },
    didParseCell: function(data) {
      if (data.column.index === 5 && data.section === 'body') {
        const status = data.cell.raw?.toLowerCase();
        if (status === 'correct') data.cell.styles.textColor = correctGreen;
        else if (status === 'wrong') data.cell.styles.textColor = wrongRed;
        else if (status === 'partial') data.cell.styles.textColor = partialYellow;
        else data.cell.styles.textColor = skippedGray;
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 10;

  // ─── Faculty Remarks ─────────────────────────────────────────
  if (y + 30 > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage();
    y = margin;
  }

  doc.setFillColor(...lightGray);
  doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
  doc.setTextColor(...brandGreen);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FACULTY REMARKS', margin + 4, y + 7);
  doc.setTextColor(...medGray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(report.facultyRemarks?.generalFeedback || 'No remarks provided.', margin + 4, y + 14);
  y += 26;

  // ─── Footer ──────────────────────────────────────────────────
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...darkGray);
  doc.rect(0, pageHeight - 18, pageWidth, 18, 'F');

  doc.setTextColor(...white);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, pageHeight - 12, { align: 'center' });
  doc.text(`NEXUS PROCTOR | ${report.exam?.name || 'Exam'} | ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 7, { align: 'center' });

  // Signature line
  if (y + 20 < pageHeight - 25) {
    doc.setDrawColor(...medGray);
    doc.line(pageWidth - margin - 50, y + 5, pageWidth - margin, y + 5);
    doc.setTextColor(...medGray);
    doc.setFontSize(6);
    doc.text('Faculty Signature', pageWidth - margin - 25, y + 10, { align: 'center' });
  }

  return doc;
}

/**
 * Download a single student's report PDF
 */
export async function downloadReportPDF(report) {
  try {
    const doc = await generateReportPDF(report);
    const studentName = (report.student?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    const examName = (report.exam?.name || 'Exam').replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`${studentName}_${examName}_Report.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert(`Failed to generate PDF: ${error.message || error.toString()}`);
  }
}

/**
 * Generate multiple report PDFs and bundle them into a ZIP
 */
export async function downloadAllReportsPDF(reports, examTitle) {
  try {
    const zip = new JSZip();

    for (let index = 0; index < reports.length; index++) {
      const report = reports[index];
      const doc = await generateReportPDF(report);
      const pdfBlob = doc.output('arraybuffer');
      const studentName = (report.student?.name || `Student_${index + 1}`).replace(/[^a-zA-Z0-9]/g, '_');
      zip.file(`${studentName}_Report.pdf`, pdfBlob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${(examTitle || 'Exam').replace(/[^a-zA-Z0-9]/g, '_')}_All_Reports.zip`);
  } catch (error) {
    console.error("Error generating ZIP:", error);
    alert(`Failed to generate ZIP bundle: ${error.message || error.toString()}`);
  }
}
