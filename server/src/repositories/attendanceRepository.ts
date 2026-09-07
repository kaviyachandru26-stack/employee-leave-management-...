import { db } from '../database/db.js';
import { Attendance, AttendanceStatus } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface AttendanceListFilters {
  employeeId?: string;
  departmentId?: string;
  managerId?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  status?: AttendanceStatus | string;
  page?: number;
  limit?: number;
}

export class AttendanceRepository {
  async findById(id: string): Promise<Attendance | null> {
    const att = db.attendances.find(a => a.id === id);
    if (!att) return null;
    return db.getHydratedAttendance(att);
  }

  async findByEmployeeAndDate(employeeId: string, date: string): Promise<Attendance | null> {
    const att = db.attendances.find(a => a.employeeId === employeeId && a.date === date);
    if (!att) return null;
    return db.getHydratedAttendance(att);
  }

  async list(filters: AttendanceListFilters = {}): Promise<{ attendances: Attendance[]; total: number; totalPages: number }> {
    let list = db.attendances.map(a => db.getHydratedAttendance(a));

    if (filters.employeeId) {
      list = list.filter(a => a.employeeId === filters.employeeId);
    }

    if (filters.managerId) {
      const directReportIds = new Set(db.employees.filter(e => e.managerId === filters.managerId).map(e => e.id));
      list = list.filter(a => directReportIds.has(a.employeeId));
    }

    if (filters.departmentId) {
      list = list.filter(a => a.employee?.departmentId === filters.departmentId);
    }

    if (filters.date) {
      list = list.filter(a => a.date === filters.date);
    }

    if (filters.startDate) {
      list = list.filter(a => a.date >= filters.startDate!);
    }

    if (filters.endDate) {
      list = list.filter(a => a.date <= filters.endDate!);
    }

    if (filters.status) {
      list = list.filter(a => a.status === filters.status);
    }

    // Sort newest date and checkIn first
    list.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return (b.checkIn || '').localeCompare(a.checkIn || '');
    });

    const total = list.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 15);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      attendances: paginated,
      total,
      totalPages,
    };
  }

  async checkIn(employeeId: string, date: string, checkInTime: string, notes?: string | null): Promise<Attendance> {
    const existing = await this.findByEmployeeAndDate(employeeId, date);
    if (existing) {
      throw new Error(`Employee already checked in for date ${date}. Duplicate check-ins are disallowed.`);
    }

    // Determine if late (after 09:15 AM local/UTC time)
    const checkInDate = new Date(checkInTime);
    const hours = checkInDate.getUTCHours();
    const minutes = checkInDate.getUTCMinutes();
    const isLate = hours > 9 || (hours === 9 && minutes > 15);

    const newAtt: Attendance = {
      id: `att-${uuidv4().slice(0, 8)}`,
      employeeId,
      date,
      checkIn: checkInTime,
      checkOut: null,
      workingHours: 0,
      status: isLate ? 'LATE' : 'PRESENT',
      notes: notes || (isLate ? 'Recorded after 09:15 AM threshold' : null),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.attendances.push(newAtt);
    return db.getHydratedAttendance(newAtt);
  }

  async checkOut(employeeId: string, date: string, checkOutTime: string, notes?: string | null): Promise<Attendance> {
    const idx = db.attendances.findIndex(a => a.employeeId === employeeId && a.date === date);
    if (idx === -1) {
      throw new Error(`No active check-in found for employee on ${date}. Cannot check out.`);
    }

    const current = db.attendances[idx];
    if (!current.checkIn) {
      throw new Error(`Missing check-in timestamp on record for ${date}.`);
    }

    const checkInMs = new Date(current.checkIn).getTime();
    const checkOutMs = new Date(checkOutTime).getTime();

    if (checkOutMs <= checkInMs) {
      throw new Error('Check-out timestamp must be strictly after the check-in timestamp.');
    }

    const diffHours = Number(((checkOutMs - checkInMs) / (1000 * 60 * 60)).toFixed(2));
    let finalStatus: AttendanceStatus = current.status;
    if (diffHours < 4.5 && current.status !== 'LATE') {
      finalStatus = 'HALF_DAY';
    }

    db.attendances[idx] = {
      ...current,
      checkOut: checkOutTime,
      workingHours: diffHours,
      status: finalStatus,
      notes: notes || current.notes,
      updatedAt: new Date().toISOString(),
    };

    return db.getHydratedAttendance(db.attendances[idx]);
  }
}

export const attendanceRepository = new AttendanceRepository();
