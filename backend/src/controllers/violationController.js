import prisma from '../config/prisma.js';

/** POST /api/violations — Log a violation */
export const logViolation = async (req, res) => {
  try {
    const { examId, type, severity, details } = req.body;
    
    // 1. Log the violation in MySQL
    const violation = await prisma.violation.create({
      data: {
        examId: examId,
        studentId: req.user.id,
        type: type,
        severity: severity || 'medium',
        details: details || '',
      }
    });

    // 2. Increment the violation count on the student's submission
    await prisma.submission.updateMany({
      where: { 
        examId: examId, 
        studentId: req.user.id 
      },
      data: { 
        violationCount: { increment: 1 } 
      }
    });

    // 3. Check if max violations exceeded → auto-submit/kick
    const exam = await prisma.exam.findUnique({ where: { id: examId } });
    
    if (exam) {
      const count = await prisma.violation.count({ 
        where: { examId: examId, studentId: req.user.id } 
      });
      
      // Parse proctoring rules from JSON
      const proctoring = exam.proctoringRules || {};
      const maxViolations = proctoring.maxViolations || 3;

      if (count >= maxViolations) {
        // Auto-submit and lock the exam
        if (proctoring.autoSubmitOnMax) {
          await prisma.submission.updateMany({
            where: { examId: examId, studentId: req.user.id },
            data: { 
              status: 'auto_submitted', 
            }
          });
        }

        return res.json({
          success: true, 
          data: violation,
          restricted: true,
          message: `Exam automatically submitted due to excessive violations (${count}/${maxViolations}).`,
        });
      }
    }

    res.json({ success: true, data: violation, restricted: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/violations/exam/:examId — Faculty: get all violations for an exam */
export const getExamViolations = async (req, res) => {
  try {
    const violations = await prisma.violation.findMany({
      where: { examId: req.params.examId },
      include: {
        student: { select: { id: true, name: true, email: true, studentId: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    // React Frontend mapping
    const formattedViolations = violations.map(v => ({ ...v, _id: v.id, student: { ...v.student, _id: v.student.id } }));
    res.json({ success: true, data: formattedViolations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/violations/student/:examId — Student's own violations */
export const getMyViolations = async (req, res) => {
  try {
    const violations = await prisma.violation.findMany({
      where: { 
        examId: req.params.examId, 
        studentId: req.user.id 
      },
      orderBy: { timestamp: 'desc' }
    });
    
    const formattedViolations = violations.map(v => ({ ...v, _id: v.id }));
    res.json({ success: true, data: formattedViolations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/violations/restrictions/:examId — Get active restrictions */
export const getRestrictions = async (req, res) => {
  // Since we bypassed the Restriction table for MySQL speed, we return an empty array so the frontend doesn't crash!
  res.json({ success: true, data: [] });
};