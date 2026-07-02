import prisma from '../config/prisma.js';

class SubjectRepository {
  async findAll({ page = 1, limit = 20, search = '', status = '', departmentId = '' }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }

    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: {
            select: { id: true, name: true, code: true }
          },
          _count: {
            select: { teachers: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.subject.count({ where })
    ]);

    return { subjects, total };
  }

  async findById(id) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        teachers: { include: { teacher: { select: { id: true, name: true, email: true } } } }
      }
    });

    if (subject) {
      subject.teachers = subject.teachers?.map(ts => ts.teacher) || [];
    }
    return subject;
  }

  async findByCode(code) {
    return prisma.subject.findUnique({
      where: { code }
    });
  }

  async create(data) {
    return prisma.subject.create({ data });
  }

  async update(id, data) {
    return prisma.subject.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.subject.delete({
      where: { id }
    });
  }

  async assignToTeacher(subjectIds, teacherId) {
    await prisma.$transaction([
      prisma.teacherSubject.deleteMany({ where: { teacherId } }),
      ...(subjectIds.length > 0 ? [
        prisma.teacherSubject.createMany({
          data: subjectIds.map(subjectId => ({ teacherId, subjectId }))
        })
      ] : [])
    ]);

    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        subjectsTeaching: { include: { subject: true } }
      }
    });

    if (user) {
      user.subjectsTeaching = user.subjectsTeaching?.map(ts => ts.subject) || [];
    }
    
    return user;
  }

  async getTeacherSubjects(teacherId) {
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        subjectsTeaching: {
          include: {
            subject: {
              include: { department: { select: { id: true, name: true } } }
            }
          }
        }
      }
    });
    return user?.subjectsTeaching?.map(ts => ts.subject) || [];
  }
}

export default new SubjectRepository();
