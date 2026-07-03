import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import AuditService from './auditService.js';

class UserService {
  async getDepartmentHeads(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const status = query.status || '';

    const skip = (page - 1) * limit;

    const where = { role: 'admin' };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { facultyId: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          departmentRel: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Remove passwords before returning
    users.forEach(u => delete u.password);

    return {
      success: true,
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };
  }

  async provisionDepartmentHead(data, superAdminId) {
    const { name, email, employeeId, phone, departmentId, passwordMode = 'auto', manualPassword } = data;

    // Validate unique email and employeeId
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { facultyId: employeeId }]
      }
    });

    if (existing) {
      throw new Error(existing.email === email ? 'Email already in use' : 'Employee ID already in use');
    }

    // Validate department exists and doesn't already have a head
    const department = await prisma.department.findUnique({ where: { id: departmentId } });
    if (!department) throw new Error('Department not found');
    if (department.headId) throw new Error('Department already has a Head assigned');

    // Handle Password Mode
    let tempPassword = null;
    let plainPasswordToHash = '';

    if (passwordMode === 'manual') {
      if (!manualPassword) throw new Error('Manual password is required when in manual mode');
      plainPasswordToHash = manualPassword;
    } else {
      tempPassword = `Nexus@${Math.floor(1000 + Math.random() * 9000)}`;
      plainPasswordToHash = tempPassword;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPasswordToHash, salt);

    // Transaction
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          facultyId: employeeId && employeeId.trim() !== '' ? employeeId : `ADM-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          password: hashedPassword,
          role: 'admin',
          mustChangePassword: true,
          status: 'ACTIVE',
          departmentId
        }
      });

      await tx.department.update({
        where: { id: departmentId },
        data: { headId: newUser.id }
      });

      return newUser;
    });

    await AuditService.log({
      userId: superAdminId,
      action: 'PROVISIONED_DEPARTMENT_HEAD',
      entity: 'User',
      entityId: user.id,
      newValues: { email: user.email, departmentId },
      details: `Assigned as head of ${department.name} | Password Mode: ${passwordMode === 'manual' ? 'Manual' : 'Auto Generated'}`
    });

    delete user.password;
    
    return {
      success: true,
      message: 'Department Head provisioned successfully',
      data: { user, ...(tempPassword ? { tempPassword } : {}) }
    };
  }

  async deleteDepartmentHead(id, superAdminId) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { departmentRel: true, departmentHeadOf: true }
    });

    if (!user) throw new Error('User not found');
    if (user.role !== 'admin' && user.role !== 'department_head') {
      throw new Error('User is not a department head');
    }

    // Transaction to clear headId from department if any, and then delete user
    await prisma.$transaction(async (tx) => {
      // Find departments where this user is the head
      const depts = await tx.department.findMany({ where: { headId: id } });
      for (const dept of depts) {
        await tx.department.update({
          where: { id: dept.id },
          data: { headId: null }
        });
      }

      await tx.user.delete({
        where: { id }
      });
    });

    await AuditService.log({
      userId: superAdminId,
      action: 'DELETED_DEPARTMENT_HEAD',
      entity: 'User',
      entityId: id,
      previousValues: { email: user.email, name: user.name },
      details: `Deleted department head ${user.name}`
    });

    return { success: true, message: 'Department head deleted successfully' };
  }
}

export default new UserService();
