import prisma from '../config/prisma.js';
import cacheService from './cache.service.js';

class DashboardService {
  async getStats() {
    const cacheKey = 'dashboard:stats';
    const cachedStats = await cacheService.get(cacheKey);
    if (cachedStats) return cachedStats;

    const [
      departments,
      departmentHeads,
      teachers,
      students,
      subjects,
      exams,
      courses,
      allocatedCourses
    ] = await Promise.all([
      prisma.department.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.subject.count(),
      prisma.exam.count(),
      prisma.course.count(),
      prisma.departmentCourse.count()
    ]);

    // Find departments without courses
    const allDepts = await prisma.department.findMany({
      include: {
        _count: {
          select: { allocatedCourses: true }
        }
      }
    });

    const departmentsWithoutCourses = allDepts.filter(d => d._count.allocatedCourses === 0).length;
    
    // Find most active department (the one with most exams/activity, or most allocated courses for simplicity)
    const mostActiveDepartment = allDepts.length > 0 ? allDepts.reduce((prev, current) => 
      (prev._count.allocatedCourses > current._count.allocatedCourses) ? prev : current
    , allDepts[0]) : null;

    const stats = {
      success: true,
      data: {
        departments,
        departmentHeads,
        teachers,
        students,
        subjects,
        exams,
        activeExams: await prisma.exam.count({ where: { status: 'published' } }),
        completedExams: await prisma.exam.count({ where: { status: 'completed' } }),
        totalSubmissions: await prisma.submission.count(),
        
        // Course Allocation Stats
        totalCourses: courses,
        allocatedCourses,
        unallocatedCourses: courses - (await prisma.course.count({
          where: { departments: { some: {} } }
        })),
        departmentsWithoutCourses,
        mostActiveDepartment: mostActiveDepartment ? mostActiveDepartment.name : null
      }
    };

    await cacheService.set(cacheKey, stats);
    return stats;
  }

  async getRecentActivity() {
    const cacheKey = 'dashboard:activity';
    const cachedActivity = await cacheService.get(cacheKey);
    if (cachedActivity) return cachedActivity;

    const activity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    const result = { success: true, data: activity };
    await cacheService.set(cacheKey, result);
    return result;
  }
}

export default new DashboardService();
