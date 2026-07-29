import { PrismaClient } from '@prisma/client';
import csv from 'csv-parser';
import stream from 'stream';
import crypto from 'crypto';

const prisma = new PrismaClient();

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
        const createdModules = [];

        for (let i = 0; i < articlesRaw.length; i += 4) {
          const chunk = articlesRaw.slice(i, i + 4);
          moduleCount++;
          
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

          const articlesData = chunk.map(article => {
            const normalizedArticle = {};
            for (const key in article) {
              const cleanKey = key.replace(/^\uFEFF/, '').trim().toLowerCase();
              normalizedArticle[cleanKey] = article[key];
            }
            const topicName = normalizedArticle['topic name'] || normalizedArticle['title'] || normalizedArticle['topic_name'] || normalizedArticle['topicname'] || normalizedArticle['article title'] || 'Untitled Topic';
            const readingMaterial = normalizedArticle['reading material'] || normalizedArticle['content'] || normalizedArticle['article_data'] || normalizedArticle['article_data_clean'] || normalizedArticle['articlecontent'] || normalizedArticle['article'] || '';
            
            return {
              moduleId: newModule.id,
              topicName,
              articleContent: readingMaterial
            };
          });

          await tx.hubArticle.createMany({ data: articlesData });
          articlesCreated += articlesData.length;
        }

        if (createdModules.length === 0) {
          throw new Error("No articles were processed, so modules couldn't be created to attach questions.");
        }

        const questionsPerModule = Math.ceil(questionsRaw.length / createdModules.length);
        let questionIndex = 0;

          const allQuestions = [];
          const allTestCases = [];

          for (const mod of createdModules) {
            const questionsForThisModule = questionsRaw.slice(questionIndex, questionIndex + questionsPerModule);
            questionIndex += questionsPerModule;

            for (const data of questionsForThisModule) {
              const questionId = crypto.randomUUID();
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

              const tcInput1 = normalizedData['testcase_input'];
              const tcOutput1 = normalizedData['testcase_output'];
              if (tcInput1 || tcOutput1) {
                allTestCases.push({ questionId, input: tcInput1 || '', expectedOutput: tcOutput1 || '', isHidden: false, points: 5 });
              }

              const tcInputHidden = normalizedData['hidden_testcase_input'];
              const tcOutputHidden = normalizedData['hidden_testcase_output'];
              if (tcInputHidden || tcOutputHidden) {
                allTestCases.push({ questionId, input: tcInputHidden || '', expectedOutput: tcOutputHidden || '', isHidden: true, points: 5 });
              }

              const exampleSuffixes = ['', '2', '3', '4'];
              exampleSuffixes.forEach(suffix => {
                const exInput = normalizedData[`problem_data_input${suffix}`];
                const exOutput = normalizedData[`problem_data_output${suffix}`];
                if ((exInput || exOutput) && exInput !== tcInput1) {
                  allTestCases.push({ 
                    questionId, 
                    input: exInput || '', 
                    expectedOutput: exOutput || '', 
                    isHidden: false, 
                    points: 0
                  });
                }
              });
              
              const formattedDesc = (problem_data_problem_desc || '').replace(/\\n/g, '\n');

              allQuestions.push({
                id: questionId,
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
                hubModuleId: mod.id
              });
            }
          }

          if (allQuestions.length > 0) {
            await tx.question.createMany({ data: allQuestions });
          }
          if (allTestCases.length > 0) {
            await tx.testCase.createMany({ data: allTestCases });
          }
          questionsCreated = allQuestions.length;

        return {
          courseId: course.id,
          modulesCreated: moduleCount,
          articlesImported: articlesCreated,
          questionsImported: questionsCreated
        };
      }, {
        maxWait: 10000,
        timeout: 60000
      });

      return res.status(200).json({
        message: 'Dual CSV uploaded and processed successfully.',
        data: result
      });

    } catch (dbError) {
      console.error('Database insertion error:', dbError);
      return res.status(500).json({ error: `Failed to insert data: ${dbError.message || dbError}` });
    }
  } catch (error) {
    console.error('CSV Upload Error:', error);
    return res.status(500).json({ error: `Upload error: ${error.message || error}` });
  }
};

export const getDepartmentCourses = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    const studentId = req.user?.id;
    
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

export const getAllCourses = async (req, res) => {
  try {
    const where = {};
    if (req.user?.role === 'admin' || req.user?.role === 'department_head') {
      where.departmentId = req.user.departmentId;
    } else if (req.user?.departmentId) {
      where.OR = [
        { departmentId: req.user.departmentId },
        { departmentId: null }
      ];
    }

    const courses = await prisma.hubCourse.findMany({
      where,
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

export const createModule = async (req, res) => {
  try {
    const { courseId, title } = req.body;
    if (!courseId || !title) {
      return res.status(400).json({ error: 'courseId and title are required.' });
    }

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

export const deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await prisma.hubCourse.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    await prisma.hubCourse.delete({
      where: { id: courseId }
    });

    res.json({ success: true, message: 'Course deleted successfully.' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
};

export const getFacultyStudentProgress = async (req, res) => {
  try {
    const departmentId = req.user?.departmentId;
    if (!departmentId) {
      return res.status(403).json({ error: 'You are not assigned to a department.' });
    }

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

    const studentIds = students.map(s => s.id);
    const submissions = await prisma.practiceSubmission.findMany({
      where: {
        studentId: { in: studentIds },
        verdict: { in: ['accepted', 'Accepted'] }
      },
      select: { studentId: true, questionId: true },
      distinct: ['studentId', 'questionId']
    });

    const studentSubmissionsMap = {};
    submissions.forEach(sub => {
      if (!studentSubmissionsMap[sub.studentId]) {
        studentSubmissionsMap[sub.studentId] = new Set();
      }
      studentSubmissionsMap[sub.studentId].add(sub.questionId);
    });

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
