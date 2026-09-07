import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const createEmployeeSchema = z.object({
  email: z.string().email('Valid email address required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']),
  employeeId: z.string().min(2, 'Employee ID required (e.g. EMP-0101)'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(5, 'Contact phone number required'),
  departmentId: z.string().min(1, 'Department selection is required'),
  position: z.string().min(2, 'Job title/position is required'),
  managerId: z.string().nullable().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Hire date must be in YYYY-MM-DD format'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  departmentId: z.string().min(1).optional(),
  position: z.string().min(2).optional(),
  managerId: z.string().nullable().optional(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  role: z.enum(['EMPLOYEE', 'MANAGER', 'HR', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

export const departmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  code: z.string().min(2, 'Department code required (e.g. ENG, HR, FIN)'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  managerId: z.string().nullable().optional(),
});

export const leaveTypeSchema = z.object({
  name: z.string().min(2, 'Leave type name required'),
  code: z.string().min(2, 'Leave type code required'),
  description: z.string().min(5, 'Description required'),
  defaultDays: z.number().int().positive('Default days must be positive'),
  isPaid: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

export const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type must be selected'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});

export const reviewLeaveRequestSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

export const checkInSchema = z.object({
  notes: z.string().max(250).optional(),
});

export const checkOutSchema = z.object({
  notes: z.string().max(250).optional(),
});

export const holidaySchema = z.object({
  name: z.string().min(2, 'Holiday name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Holiday date must be YYYY-MM-DD'),
  type: z.enum(['NATIONAL', 'COMPANY', 'OPTIONAL']),
  description: z.string().min(3, 'Description required'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().min(5).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});
