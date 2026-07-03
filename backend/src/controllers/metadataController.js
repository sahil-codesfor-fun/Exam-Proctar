import prisma from '../config/prisma.js';

// Pre-defined mapping for non-relational entities (Option B strategy)
const DEPARTMENT_MAPPINGS = {
  // We can fallback to these defaults if specific mapping isn't found
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
    
    // Role-based filtering
    if (req.user.role === 'department_head' || req.user.role === 'faculty' || req.user.role === 'teacher') {
      if (req.user.departmentId) {
        whereClause = { id: req.user.departmentId };
      } else if (req.user.department) {
        whereClause = { name: req.user.department };
      } else {
        // If they have no department assigned, return empty to force them to get one
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

// Static mappings endpoints for non-relational fields
export const getDepartmentCourses = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Fetch dynamically allocated courses from DepartmentCourse
    const allocations = await prisma.departmentCourse.findMany({
      where: { departmentId: id },
      include: { course: true },
      orderBy: { course: { name: 'asc' } }
    });
    
    // Fallback to defaults if no courses allocated yet (to avoid breaking things if they haven't allocated any)
    if (allocations.length === 0) {
      const dept = await prisma.department.findUnique({ where: { id } });
      let defaultCourses = DEPARTMENT_MAPPINGS.default.courses;
      
      if (dept) {
        if (dept.code === 'CSE' || dept.name.includes('Computer')) {
          defaultCourses = [
            { id: 'B.Tech CSE', name: 'B.Tech CSE' },
            { id: 'B.Tech CSE (AI/ML)', name: 'B.Tech CSE (AI/ML)' },
            { id: 'B.Tech CSE (Data Science)', name: 'B.Tech CSE (Data Science)' },
            { id: 'B.Tech CSE (Cyber Security)', name: 'B.Tech CSE (Cyber Security)' },
            { id: 'M.Tech CSE', name: 'M.Tech CSE' },
            { id: 'BCA', name: 'BCA' }
          ];
        } else if (dept.name.includes('Pharma')) {
          defaultCourses = [
            { id: 'B.Pharm', name: 'B.Pharm' },
            { id: 'D.Pharm', name: 'D.Pharm' },
            { id: 'M.Pharm', name: 'M.Pharm' }
          ];
        } else if (dept.name.includes('Manage')) {
          defaultCourses = [
            { id: 'BBA', name: 'BBA' },
            { id: 'MBA', name: 'MBA' }
          ];
        }
      }
      return res.json({ success: true, data: defaultCourses });
    }

    // Return the dynamic courses
    const courses = allocations.map(a => ({
      id: a.course.name, // Using name as ID for backward compatibility with Exam model which stores course as String
      name: `${a.course.name} (${a.course.code})`
    }));
    
    res.json({ success: true, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentBatches = async (req, res) => {
  try {
    // Return default batches (last 4 years)
    res.json({ success: true, data: DEPARTMENT_MAPPINGS.default.batches });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getDepartmentSections = async (req, res) => {
  try {
    // Return default sections
    res.json({ success: true, data: DEPARTMENT_MAPPINGS.default.sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
