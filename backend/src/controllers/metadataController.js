import prisma from '../config/prisma.js';

const DEPARTMENT_MAPPINGS = {
  default: {
    courses: [
      { id: 'B.Tech', name: 'B.Tech' },
      { id: 'M.Tech', name: 'M.Tech' },
      { id: 'BCA', name: 'BCA' },
      { id: 'MCA', name: 'MCA' },
      { id: 'BBA', name: 'BBA' },
      { id: 'MBA', name: 'MBA' }
    ],
    batches: Array.from({ length: 4 }, (_, i) => {
      const year = new Date().getFullYear() - i;
      return { id: year.toString(), name: `${i + 1} Year (Batch ${year})` };
    }),
    sections: [
      { id: 'A', name: 'Section A' },
      { id: 'B', name: 'Section B' },
      { id: 'C', name: 'Section C' },
      { id: 'D', name: 'Section D' }
    ]
  }
};

export const getDepartments = async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'department_head' || req.user.role === 'faculty' || req.user.role === 'teacher') {
      if (req.user.departmentId) {
        whereClause = { id: req.user.departmentId };
      } else if (req.user.department) {
        whereClause = { name: req.user.department };
      } else {
        return res.json({ success: true, data: [] });
      }
    }

    const departments = await prisma.department.findMany({
      where: whereClause,
      select: { id: true, name: true, code: true }
    });

    res.json({ success: true, data: departments });
  } catch (err) {
    console.error("Get Departments Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentSubjects = async (req, res) => {
  try {
    const { id } = req.params;
    const subjects = await prisma.subject.findMany({
      where: { departmentId: id, status: 'active' },
      select: { id: true, name: true, code: true, semester: true }
    });
    res.json({ success: true, data: subjects });
  } catch (err) {
    console.error("Get Subjects Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentTeachers = async (req, res) => {
  try {
    const { id } = req.params;
    const teachers = await prisma.user.findMany({
      where: { 
        departmentId: id,
        role: { in: ['faculty', 'teacher', 'department_head'] },
        isActive: true
      },
      select: { id: true, name: true, email: true, designation: true }
    });
    res.json({ success: true, data: teachers });
  } catch (err) {
    console.error("Get Teachers Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentCourses = async (req, res) => {
  try {
    const { id } = req.params;
    
    const allocations = await prisma.departmentCourse.findMany({
      where: { departmentId: id },
      select: {
        totalSections: true,
        course: { select: { id: true, name: true, code: true, totalSections: true } }
      },
      orderBy: { course: { name: 'asc' } }
    });
    
    if (allocations.length === 0) {
      const dept = await prisma.department.findUnique({
        where: { id },
        select: { code: true, name: true }
      });
      let defaultCourses = DEPARTMENT_MAPPINGS.default.courses.map(c => ({
        ...c,
        totalSections: 2,
        sections: [
          { id: 'A', name: 'Section A' },
          { id: 'B', name: 'Section B' }
        ]
      }));
      
      if (dept) {
        if (dept.code === 'CSE' || dept.name.includes('Computer')) {
          defaultCourses = [
            { id: 'B.Tech CSE', name: 'B.Tech CSE', totalSections: 4 },
            { id: 'B.Tech CSE (AI/ML)', name: 'B.Tech CSE (AI/ML)', totalSections: 2 },
            { id: 'B.Tech CSE (Data Science)', name: 'B.Tech CSE (Data Science)', totalSections: 2 },
            { id: 'B.Tech CSE (Cyber Security)', name: 'B.Tech CSE (Cyber Security)', totalSections: 2 },
            { id: 'M.Tech CSE', name: 'M.Tech CSE', totalSections: 1 },
            { id: 'BCA', name: 'BCA', totalSections: 2 }
          ].map(c => ({
            ...c,
            sections: Array.from({ length: c.totalSections }, (_, i) => {
              const char = String.fromCharCode(65 + i);
              return { id: char, name: `Section ${char}` };
            })
          }));
        } else if (dept.name.includes('Pharma')) {
          defaultCourses = [
            { id: 'B.Pharm', name: 'B.Pharm', totalSections: 2 },
            { id: 'D.Pharm', name: 'D.Pharm', totalSections: 2 },
            { id: 'M.Pharm', name: 'M.Pharm', totalSections: 1 }
          ].map(c => ({
            ...c,
            sections: Array.from({ length: c.totalSections }, (_, i) => {
              const char = String.fromCharCode(65 + i);
              return { id: char, name: `Section ${char}` };
            })
          }));
        } else if (dept.name.includes('Manage')) {
          defaultCourses = [
            { id: 'BBA', name: 'BBA', totalSections: 2 },
            { id: 'MBA', name: 'MBA', totalSections: 2 }
          ].map(c => ({
            ...c,
            sections: Array.from({ length: c.totalSections }, (_, i) => {
              const char = String.fromCharCode(65 + i);
              return { id: char, name: `Section ${char}` };
            })
          }));
        }
      }
      return res.json({ success: true, data: defaultCourses });
    }

    const courses = allocations.map(a => {
      const count = a.totalSections || a.course?.totalSections || 1;
      const courseName = (a.course.name || '').trim();
      const courseCode = (a.course.code || '').trim();
      return {
        id: courseName,
        courseId: a.course.id,
        name: `${courseName} (${courseCode})`,
        code: courseCode,
        totalSections: count,
        sections: Array.from({ length: count }, (_, i) => {
          const char = String.fromCharCode(65 + i);
          return { id: char, name: `Section ${char}` };
        })
      };
    });
    
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentBatches = async (req, res) => {
  try {
    res.json({ success: true, data: DEPARTMENT_MAPPINGS.default.batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentSections = async (req, res) => {
  try {
    const { id } = req.params;
    const { course, courseId } = req.query;

    if (course || courseId) {
      // Find course-wise section allocation
      const cleanCourse = (course || '').trim();
      const whereCondition = courseId 
        ? { departmentId: id, courseId }
        : { 
            departmentId: id, 
            OR: [
              { course: { name: cleanCourse } },
              { course: { code: cleanCourse } }
            ]
          };

      const allocation = await prisma.departmentCourse.findFirst({
        where: whereCondition,
        include: { course: true }
      });

      const count = allocation?.totalSections || allocation?.course?.totalSections || 1;
      const sections = Array.from({ length: count }, (_, i) => {
        const char = String.fromCharCode(65 + i);
        return { id: char, name: `Section ${char}` };
      });
      return res.json({ success: true, data: sections });
    }

    // Default: find highest section count among department's allocated courses
    const allocations = await prisma.departmentCourse.findMany({
      where: { departmentId: id },
      include: { course: true }
    });

    let maxSections = 1;
    for (const a of allocations) {
      const c = a.totalSections || a.course?.totalSections || 1;
      if (c > maxSections) maxSections = c;
    }

    if (allocations.length === 0) {
      maxSections = 4;
    }

    const sections = Array.from({ length: maxSections }, (_, i) => {
      const char = String.fromCharCode(65 + i);
      return { id: char, name: `Section ${char}` };
    });

    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
