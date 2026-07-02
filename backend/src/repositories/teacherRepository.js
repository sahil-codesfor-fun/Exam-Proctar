import prisma from '../config/prisma.js';

class TeacherRepository {
  async findByDepartmentId(departmentId, skip, take, where = {}) {
    return prisma.user.findMany({
      where: {
        role: { in: ['teacher', 'faculty'] },
        departmentId,
        ...where
      },
      skip,
      take,
      include: {
        departmentRel: { select: { name: true, code: true } },
        subjectsTeaching: { select: { id: true, name: true, code: true } },
        _count: {
          select: { submissions: true, examsCreated: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async countByDepartmentId(departmentId, where = {}) {
    return prisma.user.count({
      where: {
        role: { in: ['teacher', 'faculty'] },
        departmentId,
        ...where
      }
    });
  }

  async findByIdAndDepartment(id, departmentId) {
    return prisma.user.findFirst({
      where: {
        id,
        role: { in: ['teacher', 'faculty'] },
        departmentId
      },
      include: {
        departmentRel: { select: { name: true, code: true } },
        subjectsTeaching: true,
        loginHistory: {
          orderBy: { loginTime: 'desc' },
          take: 1
        },
        _count: {
          select: { submissions: true, examsCreated: true }
        }
      }
    });
  }

  async updateTeacher(id, departmentId, data) {
    // Ensure the teacher exists and belongs to the department before updating
    const existing = await this.findByIdAndDepartment(id, departmentId);
    if (!existing) throw new Error('Teacher not found in your department');

    return prisma.user.update({
      where: { id },
      data
    });
  }

  async hardDeleteTeacher(id, departmentId) {
    const existing = await this.findByIdAndDepartment(id, departmentId);
    if (!existing) throw new Error('Teacher not found in your department');

    if (existing._count?.examsCreated > 0) {
      throw new Error('Cannot permanently delete a teacher who has created exams. Please archive them instead.');
    }

    // Since ActivityLog does not cascade delete when the user is deleted, we must remove it first.
    await prisma.activityLog.deleteMany({
      where: { OR: [{ userId: id }, { entityId: id, entity: 'User' }] }
    });

    return prisma.user.delete({
      where: { id }
    });
  }

  async getLoginHistory(id, departmentId, skip, take) {
    const existing = await this.findByIdAndDepartment(id, departmentId);
    if (!existing) throw new Error('Teacher not found in your department');

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

  async getActivityTimeline(id, departmentId, skip, take) {
    const existing = await this.findByIdAndDepartment(id, departmentId);
    if (!existing) throw new Error('Teacher not found in your department');

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

export default new TeacherRepository();
