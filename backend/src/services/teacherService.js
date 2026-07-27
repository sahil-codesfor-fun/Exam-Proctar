import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import AuditService from './auditService.js';
import teacherRepository from '../repositories/teacherRepository.js';
import cacheService from './cache.service.js';

class TeacherService {
  async getTeachers(departmentId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const status = query.status || '';
    const designation = query.designation || '';
    const subjectId = query.subjectId || '';
    const reqDepartmentId = query.department || '';

    const effectiveDepartmentId = departmentId || reqDepartmentId || undefined;

    const skip = (page - 1) * limit;

    const cacheKey = `users:teachers:${effectiveDepartmentId || 'all'}:${page}:${limit}:${search}:${status}:${designation}:${subjectId}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }
    if (designation) where.designation = designation;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { facultyId: { contains: search } }
      ];
    }
    if (subjectId) {
      where.subjectsTeaching = {
        some: { subjectId }
      };
    }

    const [teachers, total] = await Promise.all([
      teacherRepository.findByDepartmentId(effectiveDepartmentId, skip, limit, where),
      teacherRepository.countByDepartmentId(effectiveDepartmentId, where)
    ]);

    teachers.forEach(t => delete t.password);

    const response = {
      success: true,
      data: teachers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };

    await cacheService.set(cacheKey, response);
    return response;
  }

  async provisionTeacher(data, departmentId, headId) {
    const { name, email, phone, employeeId, username, designation, qualification, experience, status, passwordMode = 'auto', manualPassword } = data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { facultyId: employeeId }] }
    });
    if (existing) throw new Error('Email or Employee ID already in use');

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

    const teacher = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        facultyId: employeeId && employeeId.trim() !== '' ? employeeId : `FAC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        password: hashedPassword,
        role: 'teacher',
        designation,
        qualification,
        experience: parseInt(experience) || null,
        status: status || 'ACTIVE',
        mustChangePassword: true,
        departmentId
      }
    });

    await AuditService.log({
      userId: headId,
      action: 'PROVISIONED_TEACHER',
      entity: 'User',
      entityId: teacher.id,
      newValues: { email, employeeId, designation },
      details: `Provisioned teacher ${name} | Password Mode: ${passwordMode === 'manual' ? 'Manual' : 'Auto Generated'}`
    });

    await cacheService.invalidateUserCaches();

    delete teacher.password;

    return {
      success: true,
      data: { teacher, ...(tempPassword ? { tempPassword } : {}) }
    };
  }

  async getTeacherDetails(id, departmentId) {
    const cacheKey = `users:teacher:${id}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const teacher = await teacherRepository.findByIdAndDepartment(id, departmentId);
    if (!teacher) throw new Error('Teacher not found');
    delete teacher.password;

    const response = { success: true, data: teacher };
    await cacheService.set(cacheKey, response);
    return response;
  }

  async updateTeacher(id, departmentId, data, headId) {
    const teacher = await teacherRepository.updateTeacher(id, departmentId, data);
    await AuditService.log({
      userId: headId,
      action: 'UPDATED_TEACHER',
      entity: 'User',
      entityId: id,
      details: `Updated teacher details for ${teacher.name}`
    });
    
    await cacheService.invalidateUserCaches();
    delete teacher.password;
    
    return { success: true, data: teacher };
  }

  async assignSubjects(teacherId, departmentId, subjectIds, headId) {
    const teacher = await teacherRepository.findByIdAndDepartment(teacherId, departmentId);
    if (!teacher) throw new Error('Teacher not found');

    const targetDeptId = departmentId || teacher.departmentId;

    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds }, departmentId: targetDeptId }
    });
    if (subjects.length !== subjectIds.length) {
      throw new Error('One or more subjects do not belong to this department');
    }

    await prisma.$transaction([
      prisma.teacherSubject.deleteMany({ where: { teacherId } }),
      ...(subjects.length > 0 ? [
        prisma.teacherSubject.createMany({
          data: subjects.map(s => ({ teacherId, subjectId: s.id }))
        })
      ] : [])
    ]);

    await AuditService.log({
      userId: headId,
      action: 'ASSIGNED_SUBJECTS',
      entity: 'User',
      entityId: teacherId,
      details: `Assigned ${subjects.length} subjects to ${teacher.name}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, message: 'Subjects assigned successfully' };
  }

  async resetPassword(teacherId, departmentId, headId) {
    const tempPassword = `Nexus@${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await teacherRepository.updateTeacher(teacherId, departmentId, {
      password: hashedPassword,
      mustChangePassword: true
    });

    await AuditService.log({
      userId: headId,
      action: 'RESET_TEACHER_PASSWORD',
      entity: 'User',
      entityId: teacherId,
      details: `Reset password for teacher ID ${teacherId}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, data: { tempPassword } };
  }

  async deleteTeacher(teacherId, departmentId, headId) {
    await teacherRepository.updateTeacher(teacherId, departmentId, { status: 'ARCHIVED', isActive: false });
    await AuditService.log({
      userId: headId,
      action: 'DELETED_TEACHER',
      entity: 'User',
      entityId: teacherId,
      details: `Soft deleted teacher ID ${teacherId}`
    });
    
    await cacheService.invalidateUserCaches();
    
    return { success: true, message: 'Teacher deleted successfully' };
  }

  async hardDeleteTeacher(teacherId, departmentId, headId) {
    await teacherRepository.hardDeleteTeacher(teacherId, departmentId);
    await AuditService.log({
      userId: headId,
      action: 'HARD_DELETED_TEACHER',
      entity: 'User',
      entityId: teacherId,
      details: `Permanently deleted teacher ID ${teacherId}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, message: 'Teacher permanently deleted' };
  }
}

export default new TeacherService();
