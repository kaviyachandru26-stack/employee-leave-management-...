import { db } from '../database/db.js';
import { Employee } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface EmployeeListFilters {
  search?: string;
  departmentId?: string;
  role?: string;
  status?: string;
  managerId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class EmployeeRepository {
  async findById(id: string): Promise<Employee | null> {
    const emp = db.employees.find(e => e.id === id);
    if (!emp) return null;
    return db.getHydratedEmployee(emp);
  }

  async findByUserId(userId: string): Promise<Employee | null> {
    const emp = db.employees.find(e => e.userId === userId);
    if (!emp) return null;
    return db.getHydratedEmployee(emp);
  }

  async findByEmployeeId(empCode: string): Promise<Employee | null> {
    const emp = db.employees.find(e => e.employeeId.toLowerCase() === empCode.toLowerCase());
    if (!emp) return null;
    return db.getHydratedEmployee(emp);
  }

  async findDirectReports(managerId: string): Promise<Employee[]> {
    return db.employees
      .filter(e => e.managerId === managerId)
      .map(e => db.getHydratedEmployee(e));
  }

  async list(filters: EmployeeListFilters = {}): Promise<{ employees: Employee[]; total: number; totalPages: number }> {
    let list = db.employees.map(e => db.getHydratedEmployee(e));

    // Filter by search (name, email, employeeId, position)
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(e => 
        e.firstName.toLowerCase().includes(q) ||
        e.lastName.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        e.position.toLowerCase().includes(q) ||
        (e.user?.email.toLowerCase().includes(q))
      );
    }

    // Filter by department
    if (filters.departmentId) {
      list = list.filter(e => e.departmentId === filters.departmentId);
    }

    // Filter by role
    if (filters.role) {
      list = list.filter(e => e.user?.role === filters.role);
    }

    // Filter by status
    if (filters.status) {
      list = list.filter(e => e.user?.status === filters.status);
    }

    // Filter by manager
    if (filters.managerId) {
      list = list.filter(e => e.managerId === filters.managerId);
    }

    // Sorting
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;
    list.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      if (sortBy === 'name') {
        aVal = `${a.firstName} ${a.lastName}`;
        bVal = `${b.firstName} ${b.lastName}`;
      }
      if (aVal < bVal) return -1 * sortOrder;
      if (aVal > bVal) return 1 * sortOrder;
      return 0;
    });

    const total = list.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      employees: paginated,
      total,
      totalPages,
    };
  }

  async create(data: Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'department' | 'manager'>): Promise<Employee> {
    const id = `emp-${uuidv4().slice(0, 8)}`;
    const newEmp: Employee = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.employees.push(newEmp);
    return db.getHydratedEmployee(newEmp);
  }

  async update(id: string, data: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'department' | 'manager'>>): Promise<Employee | null> {
    const idx = db.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;

    db.employees[idx] = {
      ...db.employees[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return db.getHydratedEmployee(db.employees[idx]);
  }

  async delete(id: string): Promise<boolean> {
    const idx = db.employees.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const emp = db.employees[idx];
    // Remove user account as well
    const uIdx = db.users.findIndex(u => u.id === emp.userId);
    if (uIdx !== -1) db.users.splice(uIdx, 1);
    db.employees.splice(idx, 1);
    return true;
  }
}

export const employeeRepository = new EmployeeRepository();
