import prisma from '../../config/prisma.js';

export const getCourses = async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
    });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { name, code, duration, credits, semesters } = req.body;
    
    const existing = await prisma.course.findUnique({ where: { code } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Course with this code already exists' });
    }

    const course = await prisma.course.create({
      data: { name, code, duration: parseInt(duration), credits: parseInt(credits), semesters: parseInt(semesters) }
    });
    res.status(201).json({ success: true, message: 'Course created successfully', data: course });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if course is allocated to any departments
    const allocations = await prisma.departmentCourse.count({
      where: { courseId: id }
    });
    
    if (allocations > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete course because it is allocated to ${allocations} department(s).` 
      });
    }

    await prisma.course.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
