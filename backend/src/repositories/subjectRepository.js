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
    return prisma.subject.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, name: true } },
        teachers: { select: { id: true, name: true, email: true } }
      }
    });
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
    // Unassign all existing subjects for this teacher first, or we can just connect/disconnect.
    // The easiest way is to set the subjects list for the teacher.
    return prisma.user.update({
      where: { id: teacherId },
      data: {
        subjectsTeaching: {
          set: subjectIds.map(id => ({ id }))
        }
      },
      include: {
        subjectsTeaching: true
      }
    });
  }

  async getTeacherSubjects(teacherId) {
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        subjectsTeaching: {
          include: {
            department: { select: { id: true, name: true } }
          }
        }
      }
    });
    return user?.subjectsTeaching || [];
  }
}

export default new SubjectRepository();
