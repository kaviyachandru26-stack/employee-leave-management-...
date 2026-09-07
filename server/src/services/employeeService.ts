import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/userRepository.js';
import { employeeRepository, EmployeeListFilters } from '../repositories/employeeRepository.js';
import { departmentRepository } from '../repositories/departmentRepository.js';
import { leaveRepository } from '../repositories/leaveRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { cache } from '../cache/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { Employee, UserRole } from '../types/index.js';

export class EmployeeService {
  async getEmployeeById(id: string): Promise<Employee> {
    const emp = await employeeRepository.findById(id);
    if (!emp) {
      throw new AppError(`Employee with ID ${id} not found`, 404);
    }
    return emp;
  }

  async listEmployees(filters: EmployeeListFilters) {
    return employeeRepository.list(filters);
  }

  async createEmployee(
    data: {
      email: string;
      password: string;
      role: UserRole;
      employeeId: string;
      firstName: string;
      lastName: string;
      phone: string;
      departmentId: string;
      position: string;
      managerId?: string | null;
      hireDate: string;
      avatarUrl?: string;
    },
    actor: { id: string; email: string }
  ): Promise<Employee> {
    // Check if email already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(`An account with email ${data.email} already exists`, 409);
    }

    // Check if employeeId code already exists
    const existingCode = await employeeRepository.findByEmployeeId(data.employeeId);
    if (existingCode) {
      throw new AppError(`Employee ID ${data.employeeId} is already assigned`, 409);
    }

    // Check department exists
    const dept = await departmentRepository.findById(data.departmentId);
    if (!dept) {
      throw new AppError(`Department with ID ${data.departmentId} does not exist`, 404);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const newUser = await userRepository.create({
      email: data.email,
      passwordHash,
      role: data.role,
      status: 'ACTIVE',
    });

    const newEmp = await employeeRepository.create({
      userId: newUser.id,
      employeeId: data.employeeId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      departmentId: data.departmentId,
      position: data.position,
      managerId: data.managerId || null,
      hireDate: data.hireDate,
      avatarUrl: data.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.firstName + ' ' + data.lastName)}`,
    });

    // Initialize leave balances for current calendar year
    const currentYear = new Date().getFullYear();
    await leaveRepository.initializeBalancesForEmployee(newEmp.id, currentYear);

    // Audit log
    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: newEmp.id,
      metadata: {
        employeeId: newEmp.employeeId,
        name: `${newEmp.firstName} ${newEmp.lastName}`,
        department: dept.name,
      },
    });

    // Invalidate cache
    await cache.invalidatePattern('employees:*');
    await cache.invalidatePattern('dashboard:summary:*');

    return newEmp;
  }

  async updateEmployee(
    id: string,
    data: any,
    actor: { id: string; email: string }
  ): Promise<Employee> {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw new AppError(`Employee not found`, 404);
    }

    if (data.departmentId) {
      const dept = await departmentRepository.findById(data.departmentId);
      if (!dept) {
        throw new AppError(`Department ${data.departmentId} does not exist`, 404);
      }
    }

    // Update user status or role if provided
    if (data.role || data.status) {
      await userRepository.update(existing.userId, {
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      });
    }

    const updated = await employeeRepository.update(id, {
      ...(data.firstName && { firstName: data.firstName }),
      ...(data.lastName && { lastName: data.lastName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.departmentId && { departmentId: data.departmentId }),
      ...(data.position && { position: data.position }),
      ...(data.managerId !== undefined && { managerId: data.managerId }),
      ...(data.hireDate && { hireDate: data.hireDate }),
      ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
    });

    if (!updated) {
      throw new AppError('Failed to update employee', 500);
    }

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'EMPLOYEE_UPDATED',
      entity: 'Employee',
      entityId: id,
      metadata: data,
    });

    await cache.invalidatePattern('employees:*');
    await cache.invalidatePattern('dashboard:summary:*');

    return updated;
  }

  async deleteEmployee(id: string, actor: { id: string; email: string }): Promise<void> {
    const existing = await employeeRepository.findById(id);
    if (!existing) {
      throw new AppError(`Employee not found`, 404);
    }

    await employeeRepository.delete(id);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'EMPLOYEE_DELETED',
      entity: 'Employee',
      entityId: id,
      metadata: { employeeCode: existing.employeeId, name: `${existing.firstName} ${existing.lastName}` },
    });

    await cache.invalidatePattern('employees:*');
    await cache.invalidatePattern('dashboard:summary:*');
  }
}

export const employeeService = new EmployeeService();
