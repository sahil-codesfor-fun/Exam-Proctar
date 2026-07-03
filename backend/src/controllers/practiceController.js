import prisma from '../config/prisma.js';

// ----------------------------------------------------
// CREATE PRACTICE SHEET
// ----------------------------------------------------
export const createPracticeSheet = async (req, res) => {
  try {
    const { title, description, publishAt, dueDate, status, questions } = req.body;
    const creatorId = req.user.id;

    const sheet = await prisma.practiceSheet.create({
      data: {
        title,
        description,
        publishAt: publishAt ? new Date(publishAt) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'draft',
        creatorId
      }
    });

    if (questions && Array.isArray(questions)) {
      for (let i = 0; i < questions.length; i++) {
        let q = questions[i];
        let questionId = q.id;
        
        if (String(q.id).startsWith('temp_')) {
          const newQ = await prisma.question.create({
            data: {
              title: q.title || 'Untitled',
              description: q.description || '',
              type: q.type || 'coding',
              difficulty: q.difficulty || 'medium',
              topic: q.topic || 'General',
              points: q.points || 10
            }
          });
          questionId = newQ.id;
          
          if (q.testCases && Array.isArray(q.testCases)) {
            for (const tc of q.testCases) {
              await prisma.testCase.create({
                data: {
                  questionId: questionId,
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  isHidden: tc.isHidden || false,
                  points: 0
                }
              });
            }
          }
        }

        await prisma.practiceSheetQuestion.create({
          data: {
            practiceSheetId: sheet.id,
            questionId: questionId,
            order: i
          }
        });
      }
    }

    res.status(201).json({ success: true, sheet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET ALL PRACTICE SHEETS (For Faculty)
// ----------------------------------------------------
export const getPracticeSheets = async (req, res) => {
  try {
    const sheets = await prisma.practiceSheet.findMany({
      include: {
        questions: { include: { question: true } },
        assignments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ success: true, sheets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// ADD QUESTION TO SHEET (From Question Bank)
// ----------------------------------------------------
export const addQuestionToSheet = async (req, res) => {
  try {
    const { sheetId, questionId, order } = req.body;
    
    // Check if the sheet exists
    const sheet = await prisma.practiceSheet.findUnique({ where: { id: sheetId } });
    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });

    // Check if the question exists
    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    const sheetQuestion = await prisma.practiceSheetQuestion.create({
      data: {
        practiceSheetId: sheetId,
        questionId: questionId,
        order: order || 0
      }
    });

    res.status(201).json({ success: true, sheetQuestion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// ASSIGN SHEET TO GROUPS/STUDENTS
// ----------------------------------------------------
export const assignPracticeSheet = async (req, res) => {
  try {
    const { sheetId, assignType, departmentId, studentId, semester, batch, section } = req.body;

    const assignment = await prisma.practiceAssignment.create({
      data: {
        practiceSheetId: sheetId,
        assignType,
        departmentId,
        studentId,
        semester,
        batch,
        section
      }
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET QUESTION (For Compiler Page)
// ----------------------------------------------------
export const getQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        testCases: {
          select: {
            input: true,
            expectedOutput: true,
            isHidden: true
          }
        }
      }
    });

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    // Hide expected outputs of hidden test cases from the client
    const safeTestCases = question.testCases.map(tc => tc.isHidden ? { input: tc.input, expectedOutput: 'Hidden', isHidden: true } : tc);

    res.status(200).json({ success: true, question: { ...question, testCases: safeTestCases } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET SINGLE PRACTICE SHEET
// ----------------------------------------------------
export const getPracticeSheetById = async (req, res) => {
  try {
    const { id } = req.params;
    const sheet = await prisma.practiceSheet.findUnique({
      where: { id },
      include: {
        questions: { 
          include: { 
            question: {
               include: { testCases: true }
            } 
          },
          orderBy: { order: 'asc' }
        },
        assignments: true
      }
    });

    if (!sheet) return res.status(404).json({ success: false, message: 'Sheet not found' });
    res.status(200).json({ success: true, sheet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// UPDATE PRACTICE SHEET
// ----------------------------------------------------
export const updatePracticeSheet = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, publishAt, dueDate, status, questions } = req.body;

    const existing = await prisma.practiceSheet.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, message: 'Sheet not found' });
    
    // Authorization check
    if (existing.creatorId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const sheet = await prisma.practiceSheet.update({
      where: { id },
      data: {
        title,
        description,
        publishAt: publishAt ? new Date(publishAt) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || existing.status
      }
    });

    if (questions && Array.isArray(questions)) {
      // Re-create the practiceSheetQuestions links
      await prisma.practiceSheetQuestion.deleteMany({
        where: { practiceSheetId: id }
      });

      for (let i = 0; i < questions.length; i++) {
        let q = questions[i];
        let questionId = q.id;
        
        if (String(q.id).startsWith('temp_')) {
          const newQ = await prisma.question.create({
            data: {
              title: q.title || 'Untitled',
              description: q.description || '',
              type: q.type || 'coding',
              difficulty: q.difficulty || 'medium',
              topic: q.topic || 'General',
              points: q.points || 10
            }
          });
          questionId = newQ.id;
          
          if (q.testCases && Array.isArray(q.testCases)) {
            for (const tc of q.testCases) {
              await prisma.testCase.create({
                data: {
                  questionId: questionId,
                  input: tc.input || '',
                  expectedOutput: tc.expectedOutput || '',
                  isHidden: tc.isHidden || false,
                  points: 0
                }
              });
            }
          }
        }

        await prisma.practiceSheetQuestion.create({
          data: {
            practiceSheetId: sheet.id,
            questionId: questionId,
            order: i
          }
        });
      }
    }

    res.status(200).json({ success: true, sheet });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET CURRENT ASSIGNED PRACTICE SHEET
// ----------------------------------------------------
export const getCurrentPracticeSheet = async (req, res) => {
  try {
    const studentId = req.user.id;
    // For now, fetch the latest published sheet assigned to this student or globally available.
    // Ideally, we'd query PracticeAssignment, but assuming they are published.
    
    // Check if there is an assignment specifically for this user
    const assignments = await prisma.practiceAssignment.findMany({
      where: {
        OR: [
          { studentId },
          { departmentId: req.user.departmentId }
        ]
      },
      include: {
        practiceSheet: {
          include: {
            questions: {
              include: { 
                question: { include: { testCases: true } }
              },
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: { practiceSheet: { createdAt: 'desc' } }
    });

    let sheet = null;
    if (assignments.length > 0) {
      sheet = assignments[0].practiceSheet;
    } else {
      // Fallback: Just get the newest published sheet
      sheet = await prisma.practiceSheet.findFirst({
        where: { status: 'published' },
        include: {
          questions: {
            include: { 
              question: { include: { testCases: true } }
            },
            orderBy: { order: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (!sheet) {
      return res.status(404).json({ success: false, message: 'No active practice sheet assigned.' });
    }

    // Fetch student's drafts and submission statuses for these questions
    const questionStatuses = await Promise.all(sheet.questions.map(async (sq) => {
      // Latest submission
      const latestSub = await prisma.practiceSubmission.findFirst({
        where: { studentId, questionId: sq.questionId },
        orderBy: { createdAt: 'desc' }
      });
      // Draft
      const draft = await prisma.codeDraft.findFirst({
        where: { studentId, questionId: sq.questionId },
        orderBy: { lastSavedAt: 'desc' }
      });

      return {
        questionId: sq.questionId,
        status: latestSub ? latestSub.status : 'Not Started',
        draft: draft ? { language: draft.language, code: draft.code } : null
      };
    }));

    res.status(200).json({ success: true, sheet, questionStatuses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// SAVE CODE DRAFT
// ----------------------------------------------------
export const saveCodeDraft = async (req, res) => {
  try {
    const { questionId, practiceSheetId, language, code } = req.body;
    const studentId = req.user.id;

    const draft = await prisma.codeDraft.upsert({
      where: {
        studentId_questionId_language: { studentId, questionId, language }
      },
      update: {
        code,
        lastSavedAt: new Date()
      },
      create: {
        studentId,
        questionId,
        practiceSheetId,
        language,
        code
      }
    });

    res.status(200).json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// GET SUBMISSION HISTORY
// ----------------------------------------------------
export const getSubmissionHistory = async (req, res) => {
  try {
    const { questionId } = req.params;
    const studentId = req.user.id;

    const submissions = await prisma.practiceSubmission.findMany({
      where: { studentId, questionId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ----------------------------------------------------
// PERFORM QUESTION ACTION (Bookmark, Mark for Review)
// ----------------------------------------------------
export const performQuestionAction = async (req, res) => {
  try {
    const { questionId, action } = req.body; // action = 'bookmarked', 'reviewed'
    const studentId = req.user.id;

    // We can store these special statuses in the most recent submission, or create a dummy one.
    // For now, let's create a dummy submission record to act as a state tracker if none exists.
    let sub = await prisma.practiceSubmission.findFirst({
      where: { studentId, questionId },
      orderBy: { createdAt: 'desc' }
    });

    if (sub) {
      let newStatus = action;
      if (sub.status === action) {
        // Toggle off: revert to accepted/attempted based on verdict
        if (sub.verdict === 'accepted') {
          newStatus = 'Accepted';
        } else if (sub.verdict === 'none' && !sub.code) {
          newStatus = 'Not Started';
        } else {
          newStatus = 'Attempted';
        }
      }
      
      sub = await prisma.practiceSubmission.update({
        where: { id: sub.id },
        data: { status: newStatus }
      });
    } else {
      sub = await prisma.practiceSubmission.create({
        data: {
          studentId,
          questionId,
          language: 'unknown',
          code: '',
          verdict: 'none',
          status: action
        }
      });
    }

    res.status(200).json({ success: true, status: sub.status });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
