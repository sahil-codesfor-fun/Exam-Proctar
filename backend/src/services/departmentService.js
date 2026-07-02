import departmentRepository from '../repositories/departmentRepository.js';
import AuditService from './auditService.js';

class DepartmentService {
  async getDepartments(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const search = query.search || '';
    const status = query.status || ''; // e.g., ACTIVE

    const result = await departmentRepository.findAll({ page, limit, search, status });
    return {
      success: true,
      data: result.departments,
      meta: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit)
      }
    };
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

    return {
      success: true,
      message: 'Department created successfully',
      data: department
    };
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

    return {
      success: true,
      message: `Department marked as ${newStatus}`,
      data: updated
    };
  }
}

export default new DepartmentService();
