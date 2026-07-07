import departmentService from '../../services/departmentService.js';
import prisma from '../../config/prisma.js';

export const getDepartments = async (req, res) => {
  try {
    const result = await departmentService.getDepartments(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createDepartment = async (req, res) => {
  try {
    const result = await departmentService.createDepartment(req.body, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartment = async (req, res) => {
  try {
    const result = await departmentService.updateDepartment(req.params.id, req.body, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDepartment = async (req, res) => {
  try {
    const result = await departmentService.deleteDepartment(req.params.id, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateDepartmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'DISABLED', 'ARCHIVED'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const result = await departmentService.updateDepartmentStatus(req.params.id, status, req.user.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Course Allocation Methods

export const getAllocatedCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const courses = await prisma.departmentCourse.findMany({
      where: { departmentId: id },
      include: { course: true }
    });
    res.status(200).json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const allocateCourses = async (req, res) => {
  try {
    const { id } = req.params;
    const { courseIds, metadata } = req.body;
    
    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return res.status(400).json({ success: false, message: "Course IDs array is required" });
    }

    // Verify department exists
    const department = await prisma.department.findUnique({ where: { id } });
    if (!department) return res.status(404).json({ success: false, message: "Department not found" });

    // Filter out already allocated courses
    const existingAllocations = await prisma.departmentCourse.findMany({
      where: { departmentId: id, courseId: { in: courseIds } }
    });
    const existingCourseIds = existingAllocations.map(a => a.courseId);
    
    const newCourseIds = courseIds.filter(cid => !existingCourseIds.includes(cid));

    if (newCourseIds.length === 0) {
      return res.status(400).json({ success: false, message: "All selected courses are already allocated to this department." });
    }

    // Validate that all newCourseIds actually exist in the database
    // (Prevents foreign key constraint errors if a course was deleted but still in frontend state)
    const validCourses = await prisma.course.findMany({
      where: { id: { in: newCourseIds } },
      select: { id: true }
    });
    const validCourseIds = validCourses.map(c => c.id);
    
    const validatedNewCourseIds = newCourseIds.filter(cid => validCourseIds.includes(cid));

    if (validatedNewCourseIds.length === 0) {
      return res.status(400).json({ success: false, message: "Selected courses are either already allocated or no longer exist." });
    }

    const newAllocations = validatedNewCourseIds.map(courseId => ({
      departmentId: id,
      courseId,
      academicYear: metadata?.academicYear || null,
      batch: metadata?.batch || null,
      semesterStructure: metadata?.semesterStructure || null,
      totalSections: metadata?.totalSections ? parseInt(metadata.totalSections) : null,
      intakeCapacity: metadata?.intakeCapacity ? parseInt(metadata.intakeCapacity) : null,
    }));

    await prisma.departmentCourse.createMany({ data: newAllocations });

    res.status(201).json({ success: true, message: `Successfully allocated ${validatedNewCourseIds.length} course(s).` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAllocatedCourse = async (req, res) => {
  try {
    const { id, courseId } = req.params;
    const { academicYear, batch, semesterStructure, totalSections, intakeCapacity, status } = req.body;

    const allocation = await prisma.departmentCourse.findUnique({
      where: { departmentId_courseId: { departmentId: id, courseId } }
    });

    if (!allocation) {
      return res.status(404).json({ success: false, message: "Allocation not found" });
    }

    const updated = await prisma.departmentCourse.update({
      where: { departmentId_courseId: { departmentId: id, courseId } },
      data: {
        academicYear,
        batch,
        semesterStructure,
        totalSections: totalSections ? parseInt(totalSections) : null,
        intakeCapacity: intakeCapacity ? parseInt(intakeCapacity) : null,
        status: status || allocation.status
      }
    });

    res.status(200).json({ success: true, message: "Allocation updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeAllocatedCourse = async (req, res) => {
  try {
    const { id, courseId } = req.params;
    
    await prisma.departmentCourse.delete({
      where: { departmentId_courseId: { departmentId: id, courseId } }
    });

    res.status(200).json({ success: true, message: "Course removed from department successfully" });
  } catch (error) {
    // Check if error is due to not found
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: "Allocation not found" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};
