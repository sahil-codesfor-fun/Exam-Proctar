import prisma from '../config/prisma.js';

class StudentRepository {
  async findAll(skip, take, where = {}) {
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        ...where
      },
      skip,
      take,
      include: {
        departmentRel: { select: { name: true, code: true } },
        _count: {
          select: { submissions: true, violations: true, examAssignments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return students;
  }

  async countAll(where = {}) {
    return prisma.user.count({
      where: {
        role: 'student',
        ...where
      }
    });
  }

  async findById(id) {
    const student = await prisma.user.findFirst({
      where: {
        id,
        role: 'student'
      },
      include: {
        departmentRel: { select: { name: true, code: true } },
        loginHistory: {
          orderBy: { loginTime: 'desc' },
          take: 1
        },
        _count: {
          select: { submissions: true, violations: true, examAssignments: true }
        }
      }
    });

    return student;
  }

  async updateStudent(id, data) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Student not found');

    return prisma.user.update({
      where: { id },
      data
    });
  }

  async hardDeleteStudent(id) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Student not found');

    if (existing._count?.submissions > 0) {
      throw new Error('Cannot permanently delete a student who has exam submissions. Please archive them instead.');
    }

    await prisma.activityLog.deleteMany({
      where: { OR: [{ userId: id }, { entityId: id, entity: 'User' }] }
    });

    return prisma.user.delete({
      where: { id }
    });
  }

  async getLoginHistory(id, skip, take) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Student not found');

    const [logs, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: id },
        orderBy: { loginTime: 'desc' },
        skip,
        take
      }),
      prisma.loginHistory.count({ where: { userId: id } })
    ]);

    return { logs, total };
  }

  async getActivityTimeline(id, skip, take) {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Student not found');

    const [activities, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { OR: [{ userId: id }, { entityId: id, entity: 'User' }] },
        orderBy: { timestamp: 'desc' },
        skip,
        take
      }),
      prisma.activityLog.count({ where: { OR: [{ userId: id }, { entityId: id, entity: 'User' }] } })
    ]);

    return { activities, total };
  }
}

export default new StudentRepository();
