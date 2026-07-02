import prisma from '../config/prisma.js';

class DashboardService {
  async getStats() {
    const [
      departments,
      departmentHeads,
      teachers,
      students,
      subjects,
      exams
    ] = await Promise.all([
      prisma.department.count(),
      prisma.user.count({ where: { role: 'admin' } }),
      prisma.user.count({ where: { role: 'teacher' } }),
      prisma.user.count({ where: { role: 'student' } }),
      prisma.subject.count(),
      prisma.exam.count()
    ]);

    return {
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
      }
    };
  }

  async getRecentActivity() {
    const activity = await prisma.activityLog.findMany({
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, role: true } }
      }
    });

    return { success: true, data: activity };
  }
}

export default new DashboardService();
