import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import stream from 'stream';

const prisma = new PrismaClient();

/**
 * Controller to handle secure bulk CSV upload of curriculum
 */
export const uploadCourseCsv = async (req, res) => {
  try {
    const articlesFile = req.files?.articlesCsv?.[0];
    const questionsFile = req.files?.questionsCsv?.[0];

    if (!articlesFile || !questionsFile) {
      return res.status(400).json({ error: 'Both articlesCsv and questionsCsv files are required.' });
    }

    const { courseTitle } = req.body;
    if (!courseTitle) {
      return res.status(400).json({ error: 'courseTitle is required.' });
    }
    
    const departmentId = req.user?.departmentId || null;

    // Helper function to parse CSV stream
    const parseCsv = (buffer) => {
      return new Promise((resolve, reject) => {
        const results = [];
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);
        bufferStream.pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => resolve(results))
          .on('error', (err) => reject(err));
      });
    };

    const articlesRaw = await parseCsv(articlesFile.buffer);
    const questionsRaw = await parseCsv(questionsFile.buffer);

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create Course
        let course = await tx.hubCourse.findFirst({
          where: { title: courseTitle, departmentId }
        });

        if (!course) {
          course = await tx.hubCourse.create({
            data: { title: courseTitle, description: 'Imported via CSV Dual Upload', departmentId }
          });
        }

        let moduleCount = 0;
        let articlesCreated = 0;
        let questionsCreated = 0;
        const createdModules = []; // Store them to attach questions

        // 2. Chunk articles into groups of 4 and create modules
        for (let i = 0; i < articlesRaw.length; i += 4) {
          const chunk = articlesRaw.slice(i, i + 4);
          moduleCount++;
          
          // Extract title from the first article to name the module
          const firstArticle = chunk[0] || {};
          const normalizedFirst = {};
          for (const key in firstArticle) {
             normalizedFirst[key.replace(/^\uFEFF/, '').trim().toLowerCase()] = firstArticle[key];
          }
          const moduleTitle = normalizedFirst['topic name'] || normalizedFirst['title'] || normalizedFirst['topic_name'] || normalizedFirst['topicname'] || normalizedFirst['article title'] || `Module ${moduleCount}`;
          
          const newModule = await tx.hubModule.create({
            data: {
              courseId: course.id,
              title: moduleTitle,
              order: moduleCount
            }
          });
          createdModules.push(newModule);

          for (const article of chunk) {
            // Normalize keys by stripping BOM, trimming, and lowercasing for robust matching
            const normalizedArticle = {};
            for (const key in article) {
              const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
              normalizedArticle[cleanKey] = article[key];
            }

            console.log("----- ARTICLE CSV ROW DUMP -----");
            console.log("Original keys:", Object.keys(article));
            console.log("Normalized keys:", Object.keys(normalizedArticle));
            const topicName = normalizedArticle['topic name'] || normalizedArticle['title'] || normalizedArticle['topic_name'] || normalizedArticle['topicname'] || normalizedArticle['article title'] || 'Untitled Topic';
            const readingMaterial = normalizedArticle['reading material'] || normalizedArticle['content'] || normalizedArticle['article_data'] || normalizedArticle['article_data_clean'] || normalizedArticle['articlecontent'] || normalizedArticle['article'] || '';
            
            await tx.hubArticle.create({
              data: {
                moduleId: newModule.id,
                topicName,
                articleContent: readingMaterial
              }
            });
            articlesCreated++;
          }
        }

        // 3. Process Questions and distribute them evenly across modules
        if (createdModules.length === 0) {
          throw new Error("No articles were processed, so modules couldn't be created to attach questions.");
        }

        const questionsPerModule = Math.ceil(questionsRaw.length / createdModules.length);
        let questionIndex = 0;

        for (const mod of createdModules) {
          const questionsForThisModule = questionsRaw.slice(questionIndex, questionIndex + questionsPerModule);
          questionIndex += questionsPerModule;

          for (const data of questionsForThisModule) {
            const normalizedData = {};
            for (const key in data) {
              const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
              normalizedData[cleanKey] = data[key];
            }

            const problem_name = normalizedData['problem_name'] || normalizedData['title'] || normalizedData['problem name'];
            const complexity = normalizedData['complexity'] || normalizedData['difficulty'];
            const problem_data_problem_desc = normalizedData['problem_data_problem_desc'] || normalizedData['description'];
            const problem_data_constraints = normalizedData['problem_data_constraints'] || normalizedData['constraints'];
            const problem_link = normalizedData['problem_link'] || normalizedData['sourceurl'] || normalizedData['url'];
            const tags = normalizedData['tags'] || normalizedData['topics'];
            const companies = normalizedData['companies'] || normalizedData['companytags'];
            const category = normalizedData['category'] || 'Practice';
            
            let companyTags = [];
            if (companies) companyTags = companies.split(',').map(tag => tag.trim());

            // Extract testcases
            const testCases = [];
            
            // 1. Explicit Judge Testcases
            const tcInput1 = normalizedData['testcase_input'];
            const tcOutput1 = normalizedData['testcase_output'];
            if (tcInput1 || tcOutput1) {
              testCases.push({ input: tcInput1 || '', expectedOutput: tcOutput1 || '', isHidden: false, points: 5 });
            }

            const tcInputHidden = normalizedData['hidden_testcase_input'];
            const tcOutputHidden = normalizedData['hidden_testcase_output'];
            if (tcInputHidden || tcOutputHidden) {
              testCases.push({ input: tcInputHidden || '', expectedOutput: tcOutputHidden || '', isHidden: true, points: 5 });
            }

            // 2. Visible Examples (problem_data_input, problem_data_input2, etc.)
            const exampleSuffixes = ['', '2', '3', '4'];
            exampleSuffixes.forEach(suffix => {
              const exInput = normalizedData[`problem_data_input${suffix}`];
              const exOutput = normalizedData[`problem_data_output${suffix}`];
              // Avoid duplicating the explicit testcase_input if it's the exact same string
              if ((exInput || exOutput) && exInput !== tcInput1) {
                testCases.push({ 
                  input: exInput || '', 
                  expectedOutput: exOutput || '', 
                  isHidden: false, 
                  points: 0 // Examples don't usually carry points in the backend
                });
              }
            });
            
            const formattedDesc = (problem_data_problem_desc || '').replace(/\\n/g, '\n');

            await tx.question.create({
              data: {
                type: 'Programming',
                title: problem_name || 'Untitled Problem',
                description: formattedDesc,
                difficulty: complexity || 'medium',
                constraints: problem_data_constraints || '',
                points: 10,
                sourceUrl: problem_link || null,
                companyTags,
                topics: tags || null,
                category: category.trim().charAt(0).toUpperCase() + category.trim().slice(1).toLowerCase(),
                solvedSource: 'NEXUS',
                hubModuleId: mod.id,
                testCases: {
                  create: testCases
                }
              }
            });
            questionsCreated++;
          }
        }

        return {
          courseId: course.id,
          modulesCreated: moduleCount,
          articlesImported: articlesCreated,
          questionsImported: questionsCreated
        };
      });

      return res.status(200).json({
        message: 'Dual CSV uploaded and processed successfully.',
        data: result
      });

    } catch (dbError) {
      console.error('Database insertion error:', dbError);
      return res.status(500).json({ error: 'Failed to insert data into database.' });
    }
  } catch (error) {
    console.error('CSV Upload Error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred during file processing.' });
  }
};

/**
 * Fetch courses scoped to the user's department (for Student Dashboard)
 */
export const getDepartmentCourses = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    const studentId = req.user?.id;
    
    // If the student doesn't have a department assigned yet, just return an empty array
    // instead of throwing an error that breaks the UI
    if (!departmentId) {
      return res.json({ success: true, courses: [] });
    }

    const courses = await prisma.hubCourse.findMany({
      where: { departmentId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            questions: {
              select: {
                id: true,
                title: true,
                difficulty: true,
                points: true,
                solvedSource: true,
                sourceUrl: true,
              }
            },
            articles: {
              select: {
                id: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate progress for each course
    let solvedQuestionIds = new Set();
    if (studentId) {
      const submissions = await prisma.practiceSubmission.findMany({
        where: { 
          studentId, 
          verdict: { in: ['accepted', 'Accepted'] } 
        },
        select: { questionId: true },
        distinct: ['questionId']
      });
      solvedQuestionIds = new Set(submissions.map(s => s.questionId));
    }

    const coursesWithProgress = courses.map(course => {
      let totalQuestions = 0;
      let solvedQuestions = 0;
      
      course.modules.forEach(mod => {
        if (mod.questions) {
          totalQuestions += mod.questions.length;
          mod.questions.forEach(q => {
            if (solvedQuestionIds.has(q.id)) {
              solvedQuestions++;
            }
          });
        }
      });
      
      let progress = 0;
      if (totalQuestions > 0) {
        const rawProgress = (solvedQuestions / totalQuestions) * 100;
        if (rawProgress > 0 && rawProgress < 1) {
          progress = 1;
        } else if (rawProgress > 99 && rawProgress < 100) {
          progress = 99;
        } else {
          progress = Math.round(rawProgress);
        }
      }
      
      return {
        ...course,
        progress
      };
    });

    res.json({ success: true, courses: coursesWithProgress });
  } catch (error) {
    console.error('Error fetching department courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
};

/**
 * Admin: Get ALL courses with module counts (for Admin dashboard)
 */
export const getAllCourses = async (req, res) => {
  try {
    const courses = await prisma.hubCourse.findMany({
      include: {
        department: { select: { name: true, code: true } },
        modules: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { questions: true, articles: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, courses });
  } catch (error) {
    console.error('Error fetching all courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
};

/**
 * Admin: Assign a course to their own department
 */
export const assignCourseToDepartment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const departmentId = req.user?.departmentId;

    if (!courseId) {
      return res.status(400).json({ error: 'courseId is required.' });
    }
    
    if (!departmentId) {
      return res.status(403).json({ error: 'You are not assigned to a department.' });
    }

    const course = await prisma.hubCourse.update({
      where: { id: courseId },
      data: { departmentId },
      include: { department: { select: { name: true } } },
    });

    res.json({ success: true, message: `Course assigned to ${course.department?.name}`, course });
  } catch (error) {
    console.error('Error assigning course:', error);
    res.status(500).json({ error: 'Failed to assign course to department.' });
  }
};

/**
 * Admin: Create a new course manually
 */
export const createCourse = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const departmentId = req.user?.departmentId || null;

    const course = await prisma.hubCourse.create({
      data: { title: title.trim(), description: description?.trim(), departmentId },
    });

    res.json({ success: true, course });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course.' });
  }
};

/**
 * Admin: Create a new module under a course
 */
export const createModule = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId and title are required.' });
    }

    // Get the current highest order
    const lastModule = await prisma.hubModule.findFirst({
      where: { courseId },
      orderBy: { order: 'desc' },
    });
    
    const newOrder = lastModule ? lastModule.order + 1 : 0;

    const module = await prisma.hubModule.create({
      data: { courseId, title: title.trim(), order: newOrder },
    });

    res.status(201).json({ success: true, message: 'Module created successfully', module });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ error: 'Failed to create module.' });
  }
};

/**
 * Get the full contents (questions & articles) of a single module
 */
export const getModuleContent = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const studentId = req.user?.id;
    
    const moduleContent = await prisma.hubModule.findUnique({
      where: { id: moduleId },
      include: {
        questions: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            owlcoderId: true,
            companyTags: true,
            category: true,
            sourceUrl: true
          }
        },
        articles: {
          select: {
            id: true,
            topicName: true,
            articleContent: true
          }
        }
      }
    });

    if (!moduleContent) {
      return res.status(404).json({ error: 'Module not found.' });
    }

    // Check solved status for each question
    if (studentId && moduleContent.questions && moduleContent.questions.length > 0) {
      const questionIds = moduleContent.questions.map(q => q.id);
      
      const solvedSubmissions = await prisma.practiceSubmission.findMany({
        where: {
          studentId,
          questionId: { in: questionIds },
          verdict: { in: ['accepted', 'Accepted'] }
        },
        select: { questionId: true },
        distinct: ['questionId']
      });
      
      const solvedSet = new Set(solvedSubmissions.map(s => s.questionId));
      
      moduleContent.questions = moduleContent.questions.map(q => ({
        ...q,
        isSolved: solvedSet.has(q.id)
      }));
    }

    res.json({ success: true, module: moduleContent });
  } catch (error) {
    console.error('Error fetching module content:', error);
    res.status(500).json({ error: 'Failed to fetch module content.' });
  }
};

/**
 * Delete a course and all its related modules, articles, and questions
 */
export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if course exists
    const course = await prisma.hubCourse.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    // Since onDelete: Cascade isn't guaranteed depending on DB, we can just let Prisma handle it 
    // if cascade is setup, or manually delete. The schema seems to have cascades based on standard Prisma.
    // Let's just delete the course directly.
    await prisma.hubCourse.delete({
      where: { id: courseId }
    });

    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
};

/**
 * Fetch student course progress for faculty in the same department
 */
export const getFacultyStudentProgress = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    if (!departmentId) {
      return res.status(403).json({ error: 'You are not assigned to a department.' });
    }

    // Fetch all students in the department
    const students = await prisma.user.findMany({
      where: {
        departmentId,
        role: 'student'
      },
      select: {
        id: true,
        name: true,
        studentId: true,
        email: true,
        course: true,
        section: true
      },
      orderBy: { studentId: 'asc' }
    });

    // Fetch all courses for the department
    const courses = await prisma.hubCourse.findMany({
      where: { departmentId },
      include: {
        modules: {
          include: {
            questions: {
              select: { id: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract all question IDs per course for fast lookup
    const courseQuestionsMap = courses.map(course => {
      let totalQuestions = 0;
      course.modules.forEach(mod => {
        if (mod.questions) {
          totalQuestions += mod.questions.length;
        }
      });
      
      const questionIds = new Set();
      course.modules.forEach(mod => {
        if (mod.questions) {
          mod.questions.forEach(q => questionIds.add(q.id));
        }
      });

      return {
        id: course.id,
        title: course.title,
        totalQuestions,
        questionIds
      };
    });

    // Fetch all accepted submissions for all students in the department
    const studentIds = students.map(s => s.id);
    const submissions = await prisma.practiceSubmission.findMany({
      where: {
        studentId: { in: studentIds },
        verdict: { in: ['accepted', 'Accepted'] }
      },
      select: { studentId: true, questionId: true },
      distinct: ['studentId', 'questionId']
    });

    // Group submissions by studentId for fast lookup
    const studentSubmissionsMap = {};
    submissions.forEach(sub => {
      if (!studentSubmissionsMap[sub.studentId]) {
        studentSubmissionsMap[sub.studentId] = new Set();
      }
      studentSubmissionsMap[sub.studentId].add(sub.questionId);
    });

    // Build the final response array
    const result = students.map(student => {
      const studentSolvedSet = studentSubmissionsMap[student.id] || new Set();
      const courseProgress = courseQuestionsMap.map(course => {
        let solvedQuestions = 0;
        
        course.questionIds.forEach(qId => {
          if (studentSolvedSet.has(qId)) {
            solvedQuestions++;
          }
        });

        let progress = 0;
        if (course.totalQuestions > 0) {
          const rawProgress = (solvedQuestions / course.totalQuestions) * 100;
          if (rawProgress > 0 && rawProgress < 1) {
            progress = 1;
          } else if (rawProgress > 99 && rawProgress < 100) {
            progress = 99;
          } else {
            progress = Math.round(rawProgress);
          }
        }

        return {
          courseId: course.id,
          title: course.title,
          progress,
          solvedQuestions,
          totalQuestions: course.totalQuestions
        };
      });

      return {
        ...student,
        courseProgress
      };
    });

    res.json({ success: true, data: result, courses: courseQuestionsMap.map(c => ({ id: c.id, title: c.title })) });
  } catch (error) {
    console.error('Error fetching faculty student progress:', error);
    res.status(500).json({ error: 'Failed to fetch student progress.' });
  }
};
