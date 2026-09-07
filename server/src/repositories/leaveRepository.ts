import { db } from '../database/db.js';
import { LeaveType, LeaveBalance, LeaveRequest, LeaveRequestStatus } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface LeaveRequestListFilters {
  employeeId?: string;
  departmentId?: string;
  managerId?: string;
  status?: LeaveRequestStatus | string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class LeaveRepository {
  // Leave Types
  async findTypeById(id: string): Promise<LeaveType | null> {
    return db.leaveTypes.find(lt => lt.id === id) || null;
  }

  async listTypes(): Promise<LeaveType[]> {
    return [...db.leaveTypes];
  }

  async createType(data: Omit<LeaveType, 'id' | 'createdAt' | 'updatedAt'>): Promise<LeaveType> {
    const newLt: LeaveType = {
      ...data,
      id: `lt-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.leaveTypes.push(newLt);
    return newLt;
  }

  // Leave Balances
  async getBalancesByEmployee(employeeId: string, year: number): Promise<LeaveBalance[]> {
    return db.leaveBalances
      .filter(lb => lb.employeeId === employeeId && lb.year === year)
      .map(lb => ({
        ...lb,
        leaveType: db.leaveTypes.find(lt => lt.id === lb.leaveTypeId),
      }));
  }

  async getSpecificBalance(employeeId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
    const lb = db.leaveBalances.find(b => b.employeeId === employeeId && b.leaveTypeId === leaveTypeId && b.year === year);
    if (!lb) return null;
    return {
      ...lb,
      leaveType: db.leaveTypes.find(lt => lt.id === lb.leaveTypeId),
    };
  }

  async initializeBalancesForEmployee(employeeId: string, year: number): Promise<LeaveBalance[]> {
    const existing = db.leaveBalances.filter(lb => lb.employeeId === employeeId && lb.year === year);
    if (existing.length > 0) return existing;

    const created: LeaveBalance[] = [];
    for (const lt of db.leaveTypes) {
      const balance: LeaveBalance = {
        id: `lb-${employeeId}-${lt.code}-${year}`,
        employeeId,
        leaveTypeId: lt.id,
        year,
        allocatedDays: lt.defaultDays,
        usedDays: 0,
        pendingDays: 0,
        remainingDays: lt.defaultDays,
        updatedAt: new Date().toISOString(),
      };
      db.leaveBalances.push(balance);
      created.push({ ...balance, leaveType: lt });
    }
    return created;
  }

  async updateBalance(balanceId: string, usedDelta: number, pendingDelta: number): Promise<LeaveBalance | null> {
    const idx = db.leaveBalances.findIndex(b => b.id === balanceId);
    if (idx === -1) return null;

    const current = db.leaveBalances[idx];
    const newUsed = Math.max(0, current.usedDays + usedDelta);
    const newPending = Math.max(0, current.pendingDays + pendingDelta);
    const newRemaining = current.allocatedDays - newUsed - newPending;

    if (newRemaining < 0) {
      throw new Error(`Insufficient leave balance. Remaining would become negative (${newRemaining} days).`);
    }

    db.leaveBalances[idx] = {
      ...current,
      usedDays: newUsed,
      pendingDays: newPending,
      remainingDays: newRemaining,
      updatedAt: new Date().toISOString(),
    };

    return db.leaveBalances[idx];
  }

  // Leave Requests
  async findRequestById(id: string): Promise<LeaveRequest | null> {
    const req = db.leaveRequests.find(r => r.id === id);
    if (!req) return null;
    return db.getHydratedLeaveRequest(req);
  }

  async findOverlappingRequests(employeeId: string, startDate: string, endDate: string, excludeRequestId?: string): Promise<LeaveRequest[]> {
    return db.leaveRequests.filter(req => {
      if (req.employeeId !== employeeId) return false;
      if (excludeRequestId && req.id === excludeRequestId) return false;
      if (req.status === 'REJECTED' || req.status === 'CANCELLED') return false;
      
      // Standard interval overlap check: start1 <= end2 and end1 >= start2
      return req.startDate <= endDate && req.endDate >= startDate;
    });
  }

  async listRequests(filters: LeaveRequestListFilters = {}): Promise<{ requests: LeaveRequest[]; total: number; totalPages: number }> {
    let list = db.leaveRequests.map(r => db.getHydratedLeaveRequest(r));

    if (filters.employeeId) {
      list = list.filter(r => r.employeeId === filters.employeeId);
    }

    if (filters.managerId) {
      // Find all employees where managerId === filters.managerId
      const directReportIds = new Set(db.employees.filter(e => e.managerId === filters.managerId).map(e => e.id));
      list = list.filter(r => directReportIds.has(r.employeeId));
    }

    if (filters.departmentId) {
      list = list.filter(r => r.employee?.departmentId === filters.departmentId);
    }

    if (filters.status) {
      list = list.filter(r => r.status === filters.status);
    }

    if (filters.leaveTypeId) {
      list = list.filter(r => r.leaveTypeId === filters.leaveTypeId);
    }

    if (filters.startDate) {
      list = list.filter(r => r.startDate >= filters.startDate!);
    }

    if (filters.endDate) {
      list = list.filter(r => r.endDate <= filters.endDate!);
    }

    // Sort newest created first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      requests: paginated,
      total,
      totalPages,
    };
  }

  async createRequest(data: Omit<LeaveRequest, 'id' | 'status' | 'reviewerId' | 'reviewerComment' | 'reviewedAt' | 'createdAt' | 'updatedAt' | 'employee' | 'leaveType' | 'reviewer'>): Promise<LeaveRequest> {
    const newReq: LeaveRequest = {
      ...data,
      id: `lr-${uuidv4().slice(0, 8)}`,
      status: 'PENDING',
      reviewerId: null,
      reviewerComment: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.leaveRequests.push(newReq);
    return db.getHydratedLeaveRequest(newReq);
  }

  async updateRequestStatus(
    id: string, 
    status: LeaveRequestStatus, 
    reviewerId: string | null, 
    comment: string | null
  ): Promise<LeaveRequest | null> {
    const idx = db.leaveRequests.findIndex(r => r.id === id);
    if (idx === -1) return null;

    db.leaveRequests[idx] = {
      ...db.leaveRequests[idx],
      status,
      reviewerId: reviewerId ?? db.leaveRequests[idx].reviewerId,
      reviewerComment: comment ?? db.leaveRequests[idx].reviewerComment,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return db.getHydratedLeaveRequest(db.leaveRequests[idx]);
  }
}

export const leaveRepository = new LeaveRepository();
