import departmentRepository from '../repositories/departmentRepository.js';
import AuditService from './auditService.js';
import cacheService from './cache.service.js';

class DepartmentService {
  async getDepartments(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const status = query.status || ''; // e.g., ACTIVE

    const cacheKey = `departments:${page}:${limit}:${search}:${status}`;
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) return cachedData;

    const result = await departmentRepository.findAll({ page, limit, search, status });
    const response = {
      success: true,
      data: result.departments,
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

  async createDepartment(data, userId) {
    // Validation
    if (!data.name || !data.code) {
      throw new Error('Department name and code are required');
    }

    const existing = await departmentRepository.findByCodeOrName(data.code, data.name);
    if (existing) {
      throw new Error('Department name or code already exists');
    }

    const department = await departmentRepository.create({
      name: data.name,
      code: data.code,
      description: data.description || null,
      email: data.email || null,
      phone: data.phone || null,
      building: data.building || null,
      floor: data.floor || null,
      status: 'ACTIVE'
    });

    await AuditService.log({
      userId,
      action: 'CREATED_DEPARTMENT',
      entity: 'Department',
      entityId: department.id,
      newValues: department
    });

    await cacheService.invalidateDepartmentCaches();

    return {
      success: true,
      message: 'Department created successfully',
      data: department
    };
  }

  async updateDepartment(id, data, userId) {
    if (!data.name || !data.code) {
      throw new Error('Department name and code are required');
    }

    const existing = await departmentRepository.findById(id);
    if (!existing) throw new Error('Department not found');

    const updated = await departmentRepository.update(id, {
      name: data.name,
      code: data.code,
      description: data.description || null,
      email: data.email || null,
      phone: data.phone || null,
      building: data.building || null,
      floor: data.floor || null,
    });

    await AuditService.log({
      userId,
      action: 'UPDATED_DEPARTMENT',
      entity: 'Department',
      entityId: id,
      newValues: updated
    });

    await cacheService.invalidateDepartmentCaches();

    return {
      success: true,
      message: 'Department updated successfully',
      data: updated
    };
  }

  async deleteDepartment(id, userId) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new Error('Department not found');

    try {
      await departmentRepository.delete(id);
      
      await AuditService.log({
        userId,
        action: 'DELETED_DEPARTMENT',
        entity: 'Department',
        entityId: id,
        details: 'Hard deleted department'
      });

      await cacheService.invalidateDepartmentCaches();

      return {
        success: true,
        message: 'Department deleted successfully'
      };
    } catch (err) {
      // If there are foreign key constraints (e.g. users attached), fallback to soft delete
      if (err.code === 'P2003') {
        const timestamp = Date.now();
        await departmentRepository.update(id, { 
          status: 'ARCHIVED',
          name: `${existing.name}_archived_${timestamp}`,
          code: `${existing.code}_archived_${timestamp}`
        });
        
        await AuditService.log({
          userId,
          action: 'ARCHIVED_DEPARTMENT',
          entity: 'Department',
          entityId: id,
          newValues: { status: 'ARCHIVED' },
          details: 'Soft deleted department due to existing relations'
        });

        await cacheService.invalidateDepartmentCaches();

        return {
          success: true,
          message: 'Department archived because it contains existing faculty/subjects'
        };
      }
      throw err;
    }
  }

  async updateDepartmentStatus(id, newStatus, userId) {
    const existing = await departmentRepository.findById(id);
    if (!existing) throw new Error('Department not found');

    const updated = await departmentRepository.update(id, { status: newStatus });

    await AuditService.log({
      userId,
      action: 'UPDATED_DEPARTMENT_STATUS',
      entity: 'Department',
      entityId: id,
      previousValues: { status: existing.status },
      newValues: { status: newStatus },
      details: `Status changed to ${newStatus}`
    });

    await cacheService.invalidateDepartmentCaches();

    return {
      success: true,
      message: `Department marked as ${newStatus}`,
      data: updated
    };
  }
}

export default new DepartmentService();
