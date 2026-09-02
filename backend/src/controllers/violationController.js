import prisma from '../config/prisma.js';

export const logViolation = async (req, res) => {
  try {
    const { examId, type, severity, details } = req.body;
    
    const violation = await prisma.violation.create({
      data: {
        examId: examId,
        studentId: req.user.id,
        type: type,
        severity: severity || 'medium',
        details: details || '',
      }
    });

    await prisma.submission.updateMany({
      where: { 
        examId: examId, 
        studentId: req.user.id 
      },
      data: { 
        violationCount: { increment: 1 } 
      }
    });

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      select: {
        id: true,
        settings: {
          select: {
            autoTerminateViolations: true,
            autoSubmit: true
          }
        }
      }
    });
    
    if (exam) {
      const count = await prisma.violation.count({ 
        where: { examId: examId, studentId: req.user.id } 
      });
      
      const maxViolations = exam.settings?.autoTerminateViolations || 3;

      if (count >= maxViolations) {
        if (exam.settings?.autoSubmit !== false) {
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

export const getExamViolations = async (req, res) => {
  try {
    const violations = await prisma.violation.findMany({
      where: { examId: req.params.examId },
      take: 200,
      include: {
        student: { select: { id: true, name: true, email: true, studentId: true } }
      },
      orderBy: { timestamp: 'desc' }
    });
    
    const formattedViolations = violations.map(v => ({ ...v, _id: v.id, student: { ...v.student, _id: v.student.id } }));
    res.json({ success: true, data: formattedViolations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getMyViolations = async (req, res) => {
  try {
    const violations = await prisma.violation.findMany({
      where: { 
        examId: req.params.examId, 
        studentId: req.user.id 
      },
      take: 100,
      orderBy: { timestamp: 'desc' }
    });
    
    const formattedViolations = violations.map(v => ({ ...v, _id: v.id }));
    res.json({ success: true, data: formattedViolations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getRestrictions = async (req, res) => {
  res.json({ success: true, data: [] });
};