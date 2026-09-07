export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'ON_LEAVE';
export type HolidayType = 'NATIONAL' | 'COMPANY' | 'OPTIONAL';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  managerId: string | null;
  employeeCount?: number;
  createdAt?: string;
}

export interface Employee {
  id: string;
  userId: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  phone: string;
  departmentId: string;
  position: string;
  managerId: string | null;
  hireDate: string;
  avatarUrl?: string;
  createdAt?: string;
  user?: {
    email: string;
    role: UserRole;
    status: UserStatus;
  };
  department?: Department;
  manager?: {
    id: string;
    firstName: string;
    lastName: string;
    position: string;
  };
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  description: string;
  defaultDays: number;
  isPaid: boolean;
  requiresApproval: boolean;
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
  leaveType?: LeaveType;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  workingDays: number;
  reason: string;
  status: LeaveRequestStatus;
  reviewerId: string | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  employee?: Employee;
  leaveType?: LeaveType;
  reviewer?: Employee;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  workingHours: number;
  notes: string | null;
  employee?: Employee;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: HolidayType;
  description: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
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

export interface DashboardSummary {
  role: UserRole;
  leaveBalances?: LeaveBalance[];
  pendingRequestsCount?: number;
  pendingRequests?: LeaveRequest[];
  todayAttendance?: Attendance | null;
  recentAttendance?: Attendance[];
  upcomingHolidays?: Holiday[];
  teamSize?: number;
  pendingApprovalsCount?: number;
  pendingApprovals?: LeaveRequest[];
  teamAttendancePercentage?: number;
  employeesOnLeaveToday?: LeaveRequest[];
  attendanceTrend?: Array<{
    date: string;
    present: number;
    late?: number;
    total?: number;
    rate: number;
  }>;
  totalEmployees?: number;
  presentToday?: number;
  lateToday?: number;
  absentToday?: number;
  onLeaveTodayCount?: number;
  departmentStats?: Array<{
    id: string;
    name: string;
    code: string;
    employeeCount: number;
    presentCount: number;
    attendanceRate: number;
  }>;
  leaveTypeStats?: Array<{
    id: string;
    name: string;
    code: string;
    allocated: number;
    used: number;
    pending: number;
    utilizationRate: number;
  }>;
  statusDistribution?: Record<string, number>;
  recentAuditLogs?: AuditLog[];
}
