import prisma from '../config/prisma.js';

class DepartmentRepository {
  async findAll({ page, limit, search, status }) {
    const skip = (page - 1) * limit;
    
    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } }
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        include: {
          head: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { users: true, subjects: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.department.count({ where })
    ]);

    return { departments, total };
  }

  async findById(id) {
    return prisma.department.findUnique({
      where: { id },
      include: {
        head: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findByCodeOrName(code, name) {
    return prisma.department.findFirst({
      where: {
        OR: [
          { code },
          { name }
        ]
      }
    });
  }

  async create(data) {
    return prisma.department.create({ data });
  }

  async update(id, data) {
    return prisma.department.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.department.delete({
      where: { id }
    });
  }
}

export default new DepartmentRepository();
