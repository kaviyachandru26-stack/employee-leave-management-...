import { attendanceRepository, AttendanceListFilters } from '../repositories/attendanceRepository.js';
import { employeeRepository } from '../repositories/employeeRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { cache } from '../cache/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { Attendance, AuthenticatedUser } from '../types/index.js';

export class AttendanceService {
  async getTodayStatus(employeeId: string): Promise<Attendance | null> {
    const today = new Date().toISOString().split('T')[0];
    return attendanceRepository.findByEmployeeAndDate(employeeId, today);
  }

  async checkIn(user: AuthenticatedUser, notes?: string): Promise<Attendance> {
    if (!user.employeeId) {
      throw new AppError('No employee profile associated with this account.', 400);
    }

    const today = new Date().toISOString().split('T')[0];
    const nowISO = new Date().toISOString();

    const existing = await attendanceRepository.findByEmployeeAndDate(user.employeeId, today);
    if (existing) {
      throw new AppError(`You have already checked in today (${today}) at ${new Date(existing.checkIn!).toLocaleTimeString()}.`, 409);
    }

    const record = await attendanceRepository.checkIn(user.employeeId, today, nowISO, notes);

    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'ATTENDANCE_CHECK_IN',
      entity: 'Attendance',
      entityId: record.id,
      metadata: { status: record.status, checkIn: nowISO },
    });

    await cache.invalidatePattern('dashboard:summary:*');
    await cache.invalidatePattern('analytics:*');

    return record;
  }

  async checkOut(user: AuthenticatedUser, notes?: string): Promise<Attendance> {
    if (!user.employeeId) {
      throw new AppError('No employee profile associated with this account.', 400);
    }

    const today = new Date().toISOString().split('T')[0];
    const nowISO = new Date().toISOString();

    const existing = await attendanceRepository.findByEmployeeAndDate(user.employeeId, today);
    if (!existing) {
      throw new AppError('You must check in before you can check out.', 400);
    }

    if (existing.checkOut) {
      throw new AppError(`You have already checked out today at ${new Date(existing.checkOut).toLocaleTimeString()}.`, 409);
    }

    const record = await attendanceRepository.checkOut(user.employeeId, today, nowISO, notes);

    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'Attendance',
      entityId: record.id,
      metadata: { workingHours: record.workingHours, checkOut: nowISO },
    });

    await cache.invalidatePattern('dashboard:summary:*');
    await cache.invalidatePattern('analytics:*');

    return record;
  }

  async listAttendance(filters: AttendanceListFilters, user: AuthenticatedUser) {
    const scoped: AttendanceListFilters = { ...filters };

    // Enforce role authorization
    if (user.role === 'EMPLOYEE') {
      scoped.employeeId = user.employeeId;
    } else if (user.role === 'MANAGER' && !scoped.employeeId) {
      scoped.managerId = user.employeeId;
    }

    return attendanceRepository.list(scoped);
  }
}

export const attendanceService = new AttendanceService();
