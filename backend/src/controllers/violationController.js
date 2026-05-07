import Violation from '../models/Violation.js';
import Restriction from '../models/Restriction.js';
import Submission from '../models/Submission.js';
import Exam from '../models/Exam.js';

/** POST /api/violations — Log a violation */
export const logViolation = async (req, res) => {
  try {
    const { examId, type, severity, details } = req.body;
    const violation = await Violation.create({
      exam: examId,
      student: req.user._id,
      type,
      severity: severity || 'medium',
      details: details || '',
    });

    // Update submission violation count
    await Submission.findOneAndUpdate(
      { exam: examId, student: req.user._id, status: 'in_progress' },
      { $inc: { violationCount: 1 } }
    );

    // Check if max violations exceeded → auto-restrict
    const exam = await Exam.findById(examId);
    if (exam) {
      const count = await Violation.countDocuments({ exam: examId, student: req.user._id });
      if (count >= (exam.proctoring?.maxViolations || 3)) {
        // Create restriction
        const restrictionMins = exam.proctoring?.restrictionMinutes || 30;
        await Restriction.findOneAndUpdate(
          { student: req.user._id, exam: examId },
          {
            reason: `Exceeded maximum violations (${count}/${exam.proctoring?.maxViolations || 3})`,
            restrictedAt: new Date(),
            expiresAt: new Date(Date.now() + restrictionMins * 60000),
            isActive: true,
            violationCount: count,
          },
          { upsert: true, new: true }
        );

        // Auto-submit if configured
        if (exam.proctoring?.autoSubmitOnMax) {
          await Submission.findOneAndUpdate(
            { exam: examId, student: req.user._id, status: 'in_progress' },
            { status: 'auto_submitted', autoSubmit: true, autoSubmitReason: 'Max violations exceeded', submittedAt: new Date() }
          );
        }

        return res.json({
          success: true, data: violation,
          restricted: true,
          message: `Restricted for ${restrictionMins} minutes due to excessive violations.`,
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
    const violations = await Violation.find({ exam: req.params.examId })
      .populate('student', 'name email studentId')
      .sort({ timestamp: -1 });
    res.json({ success: true, data: violations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/violations/student/:examId — Student's own violations */
export const getMyViolations = async (req, res) => {
  try {
    const violations = await Violation.find({ exam: req.params.examId, student: req.user._id })
      .sort({ timestamp: -1 });
    res.json({ success: true, data: violations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/** GET /api/violations/restrictions/:examId — Get active restrictions */
export const getRestrictions = async (req, res) => {
  try {
    const restrictions = await Restriction.find({ exam: req.params.examId, isActive: true })
      .populate('student', 'name email studentId');
    res.json({ success: true, data: restrictions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
