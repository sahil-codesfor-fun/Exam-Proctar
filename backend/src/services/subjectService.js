import subjectRepository from '../repositories/subjectRepository.js';
import departmentRepository from '../repositories/departmentRepository.js';
import AuditService from './auditService.js';
import prisma from '../config/prisma.js';
import cacheService from './cache.service.js';

class SubjectService {
  async getSubjects(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const status = query.status || '';
    const departmentId = query.departmentId || '';

    const cacheKey = `subjects:list:${page}:${limit}:${search}:${status}:${departmentId}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const result = await subjectRepository.findAll({ page, limit, search, status, departmentId });
    const response = {
      success: true,
      data: result.subjects,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    };

    await cacheService.set(cacheKey, response);
    return response;
  }

  async getSubjectById(id) {
    const cacheKey = `subjects:detail:${id}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const subject = await subjectRepository.findById(id);
    if (!subject) throw new Error('Subject not found');

    const response = { success: true, data: subject };
    await cacheService.set(cacheKey, response);
    return response;
  }

  async createSubject(data, userId) {
    if (!data.name || !data.code || !data.departmentId) {
      throw new Error('Name, code, and departmentId are required');
    }

    const existingCode = await subjectRepository.findByCode(data.code);
    if (existingCode) {
      throw new Error('Subject code must be unique');
    }

    const dept = await departmentRepository.findById(data.departmentId);
    if (!dept) {
      throw new Error('Department not found');
    }

    const subject = await subjectRepository.create({
      name: data.name,
      code: data.code,
      semester: data.semester ? parseInt(data.semester) : null,
      credits: data.credits ? parseInt(data.credits) : null,
      status: data.status || 'active',
      departmentId: data.departmentId
    });

    await AuditService.log({
      userId,
      action: 'CREATED_SUBJECT',
      entity: 'Subject',
      entityId: subject.id,
      newValues: subject
    });

    await cacheService.invalidateSubjectCaches();
    return { success: true, message: 'Subject created successfully', data: subject };
  }

  async updateSubject(id, data, userId) {
    const existing = await subjectRepository.findById(id);
    if (!existing) throw new Error('Subject not found');

    if (data.code && data.code !== existing.code) {
      const checkCode = await subjectRepository.findByCode(data.code);
      if (checkCode) throw new Error('Subject code already exists');
    }

    const updated = await subjectRepository.update(id, {
      name: data.name !== undefined ? data.name : existing.name,
      code: data.code !== undefined ? data.code : existing.code,
      semester: data.semester !== undefined ? parseInt(data.semester) : existing.semester,
      credits: data.credits !== undefined ? parseInt(data.credits) : existing.credits,
      status: data.status !== undefined ? data.status : existing.status,
      departmentId: data.departmentId !== undefined ? data.departmentId : existing.departmentId,
    });

    await AuditService.log({
      userId,
      action: 'UPDATED_SUBJECT',
      entity: 'Subject',
      entityId: id,
      newValues: updated
    });

    await cacheService.invalidateSubjectCaches();
    return { success: true, message: 'Subject updated successfully', data: updated };
  }

  async deleteSubject(id, userId) {
    const existing = await subjectRepository.findById(id);
    if (!existing) throw new Error('Subject not found');

    try {
      await subjectRepository.delete(id);
      
      await AuditService.log({
        userId,
        action: 'DELETED_SUBJECT',
        entity: 'Subject',
        entityId: id,
        details: 'Hard deleted subject'
      });

      await cacheService.invalidateSubjectCaches();
      return { success: true, message: 'Subject deleted successfully' };
    } catch (err) {
      if (err.code === 'P2003') {
        const timestamp = Date.now();
        const updated = await subjectRepository.update(id, { 
          status: 'ARCHIVED',
          code: `${existing.code}_archived_${timestamp}` 
        });

        await AuditService.log({
          userId,
          action: 'ARCHIVED_SUBJECT',
          entity: 'Subject',
          entityId: id,
          newValues: { status: 'ARCHIVED' },
          details: 'Soft deleted subject due to existing relations'
        });

        await cacheService.invalidateSubjectCaches();
        return { success: true, message: 'Subject archived because it has existing associations (exams or teachers)' };
      }
      throw err;
    }
  }

  // Admin assigning subjects to teacher
  async assignSubjectsToTeacher(teacherId, subjectIds, adminDepartmentId, userId) {
    // 1. Verify Teacher belongs to Admin's department
    const teacher = await prisma.user.findUnique({ where: { id: teacherId } });
    if (!teacher) throw new Error('Teacher not found');
    if (teacher.departmentId !== adminDepartmentId) {
      throw new Error('You can only assign subjects to teachers in your department');
    }

    // 2. Verify all subjects belong to Admin's department
    const subjects = await prisma.subject.findMany({
      where: { id: { in: subjectIds } }
    });
    
    if (subjects.length !== subjectIds.length) {
      throw new Error('One or more subjects not found');
    }

    for (const sub of subjects) {
      if (sub.departmentId !== adminDepartmentId) {
        throw new Error(`Subject ${sub.name} does not belong to your department`);
      }
    }

    const updatedTeacher = await subjectRepository.assignToTeacher(subjectIds, teacherId);

    await AuditService.log({
      userId,
      action: 'ASSIGNED_SUBJECTS_TO_TEACHER',
      entity: 'User',
      entityId: teacherId,
      newValues: { subjectIds }
    });

    await cacheService.invalidateSubjectCaches();
    await cacheService.invalidateUserCaches();
    return { success: true, message: 'Subjects assigned successfully' };
  }

  async getTeacherSubjects(teacherId) {
    const cacheKey = `subjects:teacher:${teacherId}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const subjects = await subjectRepository.getTeacherSubjects(teacherId);
    
    const response = { success: true, data: subjects };
    await cacheService.set(cacheKey, response);
    return response;
  }
}

export default new SubjectService();
