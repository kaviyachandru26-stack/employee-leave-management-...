export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE' | 'HOLIDAY' | 'WEEKEND';
export type HolidayType = 'NATIONAL' | 'COMPANY' | 'OPTIONAL';
export type NotificationType = 
  | 'LEAVE_SUBMITTED' 
  | 'LEAVE_APPROVED' 
  | 'LEAVE_REJECTED' 
  | 'LEAVE_CANCELLED' 
  | 'APPROVAL_REQUIRED' 
  | 'HOLIDAY_ALERT' 
  | 'ATTENDANCE_ALERT' 
  | 'SYSTEM';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeId: string; // e.g. "EMP-00101"
  firstName: string;
  lastName: string;
  phone: string;
  departmentId: string;
  position: string;
  managerId: string | null;
  hireDate: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  user?: Omit<User, 'passwordHash'>;
  department?: Department;
  manager?: Employee;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId: string | null;
  createdAt: string;
  updatedAt: string;
  employeeCount?: number;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultDays: number;
  isPaid: boolean;
  requiresApproval: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  year: number;
  allocatedDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  updatedAt: string;
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  workingDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewerId: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
  leaveType?: LeaveType;
  reviewer?: Employee;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string | null; // ISO string
  checkOut: string | null; // ISO string
  workingHours: number; // in hours (e.g. 8.25)
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee?: Employee;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: HolidayType;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employeeId?: string;
  employeeCode?: string;
  departmentId?: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
    employee?: {
      id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      departmentId: string;
      departmentName?: string;
      position: string;
      avatarUrl?: string;
    };
  };
}
