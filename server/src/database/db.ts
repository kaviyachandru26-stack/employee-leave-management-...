import { 
  User, Employee, Department, LeaveType, LeaveBalance, LeaveRequest, 
  Attendance, Holiday, Notification, AuditLog 
} from '../types/index.js';
import { getSeedData } from './seedData.js';
import { logger } from '../utils/logger.js';

class InMemoryPostgresStore {
  public users: User[] = [];
  public employees: Employee[] = [];
  public departments: Department[] = [];
  public leaveTypes: LeaveType[] = [];
  public leaveBalances: LeaveBalance[] = [];
  public leaveRequests: LeaveRequest[] = [];
  public attendances: Attendance[] = [];
  public holidays: Holiday[] = [];
  public notifications: Notification[] = [];
  public auditLogs: AuditLog[] = [];

  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    this.initPromise = (async () => {
      try {
        const data = await getSeedData();
        this.departments = data.departments;
        this.users = data.users;
        this.employees = data.employees;
        this.leaveTypes = data.leaveTypes;
        this.leaveBalances = data.leaveBalances;
        this.holidays = data.holidays;
        this.leaveRequests = data.leaveRequests;
        this.attendances = data.attendances;
        this.notifications = data.notifications;
        this.auditLogs = data.auditLogs;
        this.isInitialized = true;
        logger.info('Database initialized and successfully seeded with enterprise demo datasets.');
      } catch (err) {
        logger.error('Failed to initialize database seed', err);
      }
    })();
    return this.initPromise;
  }

  // Transaction simulator for multi-step atomic operations
  async transaction<T>(callback: (trx: InMemoryPostgresStore) => Promise<T>): Promise<T> {
    // Deep clone snapshot for rollback support if an error is thrown
    const snapshot = {
      users: JSON.parse(JSON.stringify(this.users)),
      employees: JSON.parse(JSON.stringify(this.employees)),
      departments: JSON.parse(JSON.stringify(this.departments)),
      leaveTypes: JSON.parse(JSON.stringify(this.leaveTypes)),
      leaveBalances: JSON.parse(JSON.stringify(this.leaveBalances)),
      leaveRequests: JSON.parse(JSON.stringify(this.leaveRequests)),
      attendances: JSON.parse(JSON.stringify(this.attendances)),
      holidays: JSON.parse(JSON.stringify(this.holidays)),
      notifications: JSON.parse(JSON.stringify(this.notifications)),
      auditLogs: JSON.parse(JSON.stringify(this.auditLogs)),
    };

    try {
      return await callback(this);
    } catch (err) {
      // Rollback
      this.users = snapshot.users;
      this.employees = snapshot.employees;
      this.departments = snapshot.departments;
      this.leaveTypes = snapshot.leaveTypes;
      this.leaveBalances = snapshot.leaveBalances;
      this.leaveRequests = snapshot.leaveRequests;
      this.attendances = snapshot.attendances;
      this.holidays = snapshot.holidays;
      this.notifications = snapshot.notifications;
      this.auditLogs = snapshot.auditLogs;
      logger.warn('Transaction rolled back due to error:', err);
      throw err;
    }
  }

  // Relations Hydration Helpers
  getHydratedEmployee(emp: Employee): Employee {
    const user = this.users.find(u => u.id === emp.userId);
    const department = this.departments.find(d => d.id === emp.departmentId);
    const manager = emp.managerId ? this.employees.find(m => m.id === emp.managerId) : undefined;

    return {
      ...emp,
      user: user ? { id: user.id, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt, updatedAt: user.updatedAt } : undefined,
      department,
      manager: manager ? { ...manager } : undefined,
    };
  }

  getHydratedLeaveRequest(req: LeaveRequest): LeaveRequest {
    const emp = this.employees.find(e => e.id === req.employeeId);
    const leaveType = this.leaveTypes.find(lt => lt.id === req.leaveTypeId);
    const reviewer = req.reviewerId ? this.employees.find(e => e.id === req.reviewerId) : null;

    return {
      ...req,
      employee: emp ? this.getHydratedEmployee(emp) : undefined,
      leaveType,
      reviewer: reviewer ? this.getHydratedEmployee(reviewer) : undefined,
    };
  }

  getHydratedAttendance(att: Attendance): Attendance {
    const emp = this.employees.find(e => e.id === att.employeeId);
    return {
      ...att,
      employee: emp ? this.getHydratedEmployee(emp) : undefined,
    };
  }
}

export const db = new InMemoryPostgresStore();
// Auto-initialize asynchronously
db.initialize();
