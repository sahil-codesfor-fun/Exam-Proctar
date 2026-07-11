import prisma from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import AuditService from './auditService.js';
import studentRepository from '../repositories/studentRepository.js';
import cacheService from './cache.service.js';

class StudentService {
  async getStudents(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const search = query.search || '';
    const status = query.status || '';
    const course = query.course || '';
    const section = query.section || '';

    const skip = (page - 1) * limit;

    const cacheKey = `users:students:${page}:${limit}:${search}:${status}:${course}:${section}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = { not: 'ARCHIVED' };
    }
    if (course) where.course = course;
    if (section) where.section = section;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { studentId: { contains: search } }
      ];
    }

    const [students, total] = await Promise.all([
      studentRepository.findAll(skip, limit, where),
      studentRepository.countAll(where)
    ]);

    // Remove passwords
    students.forEach(s => delete s.password);

    const response = {
      success: true,
      data: students,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    };

    await cacheService.set(cacheKey, response);
    return response;
  }

  async getStudentDetails(id) {
    const cacheKey = `users:student:${id}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const student = await studentRepository.findById(id);
    if (!student) throw new Error('Student not found');
    delete student.password;

    const response = { success: true, data: student };
    await cacheService.set(cacheKey, response);
    return response;
  }

  async updateStudent(id, data, adminId) {
    const student = await studentRepository.updateStudent(id, data);
    await AuditService.log({
      userId: adminId,
      action: 'UPDATED_STUDENT',
      entity: 'User',
      entityId: id,
      details: `Updated student details for ${student.name}`
    });

    await cacheService.invalidateUserCaches();
    delete student.password;

    return { success: true, data: student };
  }

  async resetPassword(studentId, adminId) {
    const tempPassword = `Nexus@${Math.floor(1000 + Math.random() * 9000)}`;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await studentRepository.updateStudent(studentId, {
      password: hashedPassword,
      mustChangePassword: true
    });

    await AuditService.log({
      userId: adminId,
      action: 'RESET_STUDENT_PASSWORD',
      entity: 'User',
      entityId: studentId,
      details: `Reset password for student ID ${studentId}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, data: { tempPassword } };
  }

  async deleteStudent(studentId, adminId) {
    await studentRepository.updateStudent(studentId, { status: 'ARCHIVED', isActive: false });
    await AuditService.log({
      userId: adminId,
      action: 'DELETED_STUDENT',
      entity: 'User',
      entityId: studentId,
      details: `Soft deleted student ID ${studentId}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, message: 'Student archived successfully' };
  }

  async hardDeleteStudent(studentId, adminId) {
    await studentRepository.hardDeleteStudent(studentId);
    await AuditService.log({
      userId: adminId,
      action: 'HARD_DELETED_STUDENT',
      entity: 'User',
      entityId: studentId,
      details: `Permanently deleted student ID ${studentId}`
    });

    await cacheService.invalidateUserCaches();

    return { success: true, message: 'Student permanently deleted' };
  }

  async getLoginHistory(studentId, skip, limit) {
    return studentRepository.getLoginHistory(studentId, skip, limit);
  }

  async getActivityTimeline(studentId, skip, limit) {
    return studentRepository.getActivityTimeline(studentId, skip, limit);
  }
}

export default new StudentService();
