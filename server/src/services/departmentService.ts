import { departmentRepository } from '../repositories/departmentRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { cache } from '../cache/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { Department } from '../types/index.js';

export class DepartmentService {
  async listDepartments(): Promise<Department[]> {
    const cacheKey = 'departments:list';
    const cached = await cache.get<Department[]>(cacheKey);
    if (cached) return cached;

    const list = await departmentRepository.list();
    await cache.set(cacheKey, list, 600);
    return list;
  }

  async getDepartmentById(id: string): Promise<Department> {
    const dept = await departmentRepository.findById(id);
    if (!dept) {
      throw new AppError(`Department ${id} not found`, 404);
    }
    return dept;
  }

  async createDepartment(
    data: { name: string; code: string; description: string; managerId?: string | null },
    actor: { id: string; email: string }
  ): Promise<Department> {
    const existingCode = await departmentRepository.findByCode(data.code);
    if (existingCode) {
      throw new AppError(`Department code ${data.code} already exists`, 409);
    }

    const dept = await departmentRepository.create(data);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'DEPARTMENT_CREATED',
      entity: 'Department',
      entityId: dept.id,
      metadata: { name: dept.name, code: dept.code },
    });

    await cache.invalidatePattern('departments:*');
    return dept;
  }

  async updateDepartment(
    id: string,
    data: Partial<Pick<Department, 'name' | 'code' | 'description' | 'managerId'>>,
    actor: { id: string; email: string }
  ): Promise<Department> {
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new AppError(`Department not found`, 404);
    }

    if (data.code && data.code !== existing.code) {
      const existingCode = await departmentRepository.findByCode(data.code);
      if (existingCode && existingCode.id !== id) {
        throw new AppError(`Department code ${data.code} already taken`, 409);
      }
    }

    const updated = await departmentRepository.update(id, data);
    if (!updated) throw new AppError('Failed to update department', 500);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'DEPARTMENT_UPDATED',
      entity: 'Department',
      entityId: id,
      metadata: data,
    });

    await cache.invalidatePattern('departments:*');
    return updated;
  }

  async deleteDepartment(id: string, actor: { id: string; email: string }): Promise<void> {
    const existing = await departmentRepository.findById(id);
    if (!existing) {
      throw new AppError(`Department not found`, 404);
    }

    if ((existing.employeeCount || 0) > 0) {
      throw new AppError(`Cannot delete department ${existing.name}. It still has ${existing.employeeCount} assigned employees.`, 400);
    }

    await departmentRepository.delete(id);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'DEPARTMENT_DELETED',
      entity: 'Department',
      entityId: id,
      metadata: { code: existing.code, name: existing.name },
    });

    await cache.invalidatePattern('departments:*');
  }
}

export const departmentService = new DepartmentService();
