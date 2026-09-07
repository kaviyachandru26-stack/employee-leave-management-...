import { db } from '../database/db.js';
import { Department } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class DepartmentRepository {
  async findById(id: string): Promise<Department | null> {
    const dept = db.departments.find(d => d.id === id);
    if (!dept) return null;
    const count = db.employees.filter(e => e.departmentId === id).length;
    return { ...dept, employeeCount: count };
  }

  async findByCode(code: string): Promise<Department | null> {
    const dept = db.departments.find(d => d.code.toLowerCase() === code.toLowerCase().trim());
    if (!dept) return null;
    return { ...dept };
  }

  async list(): Promise<Department[]> {
    return db.departments.map(dept => {
      const count = db.employees.filter(e => e.departmentId === dept.id).length;
      return {
        ...dept,
        employeeCount: count,
      };
    });
  }

  async create(data: { name: string; code: string; description: string; managerId?: string | null }): Promise<Department> {
    const newDept: Department = {
      id: `dept-${uuidv4().slice(0, 8)}`,
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      description: data.description.trim(),
      managerId: data.managerId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.departments.push(newDept);
    return newDept;
  }

  async update(id: string, data: Partial<Pick<Department, 'name' | 'code' | 'description' | 'managerId'>>): Promise<Department | null> {
    const idx = db.departments.findIndex(d => d.id === id);
    if (idx === -1) return null;

    db.departments[idx] = {
      ...db.departments[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return db.departments[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = db.departments.findIndex(d => d.id === id);
    if (idx === -1) return false;
    db.departments.splice(idx, 1);
    return true;
  }
}

export const departmentRepository = new DepartmentRepository();
