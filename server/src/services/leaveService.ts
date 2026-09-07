import { leaveRepository, LeaveRequestListFilters } from '../repositories/leaveRepository.js';
import { employeeRepository } from '../repositories/employeeRepository.js';
import { holidayRepository } from '../repositories/holidayRepository.js';
import { notificationRepository } from '../repositories/notificationRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { cache } from '../cache/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { LeaveRequest, LeaveBalance, LeaveType, AuthenticatedUser } from '../types/index.js';

export class LeaveService {
  /**
   * Calculates calendar days and actual working days, excluding weekends and official holidays
   */
  async calculateLeaveDays(startDateStr: string, endDateStr: string): Promise<{ totalDays: number; workingDays: number; holidaysEncountered: string[] }> {
    const start = new Date(startDateStr + 'T00:00:00Z');
    const end = new Date(endDateStr + 'T00:00:00Z');

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new AppError('Invalid date format. Use YYYY-MM-DD.', 400);
    }

    if (end < start) {
      throw new AppError('End date cannot be prior to start date.', 400);
    }

    const holidays = await holidayRepository.list(start.getFullYear());
    const holidayDateMap = new Set(holidays.map(h => h.date));

    let totalDays = 0;
    let workingDays = 0;
    const holidaysEncountered: string[] = [];

    const curr = new Date(start);
    while (curr <= end) {
      totalDays++;
      const dayOfWeek = curr.getUTCDay(); // 0 is Sunday, 6 is Saturday
      const dateStr = curr.toISOString().split('T')[0];

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidayDateMap.has(dateStr);

      if (isHoliday) {
        holidaysEncountered.push(dateStr);
      }

      if (!isWeekend && !isHoliday) {
        workingDays++;
      }

      curr.setUTCDate(curr.getUTCDate() + 1);
    }

    return { totalDays, workingDays, holidaysEncountered };
  }

  async getLeaveTypes(): Promise<LeaveType[]> {
    const cached = await cache.get<LeaveType[]>('leave_types:active');
    if (cached) return cached;
    const types = await leaveRepository.listTypes();
    await cache.set('leave_types:active', types, 3600);
    return types;
  }

  async getEmployeeBalances(employeeId: string, year = new Date().getFullYear()): Promise<LeaveBalance[]> {
    let balances = await leaveRepository.getBalancesByEmployee(employeeId, year);
    if (balances.length === 0) {
      balances = await leaveRepository.initializeBalancesForEmployee(employeeId, year);
    }
    return balances;
  }

  async applyLeave(
    data: { leaveTypeId: string; startDate: string; endDate: string; reason: string },
    user: AuthenticatedUser
  ): Promise<LeaveRequest> {
    if (!user.employeeId) {
      throw new AppError('No employee profile associated with this account.', 400);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (data.startDate < todayStr) {
      throw new AppError('Leave requests cannot be submitted for past dates.', 400);
    }

    const emp = await employeeRepository.findById(user.employeeId);
    if (!emp) throw new AppError('Employee record not found', 404);

    const leaveType = await leaveRepository.findTypeById(data.leaveTypeId);
    if (!leaveType) throw new AppError('Leave type not found', 404);

    // 1. Check for overlapping active requests
    const overlapping = await leaveRepository.findOverlappingRequests(emp.id, data.startDate, data.endDate);
    if (overlapping.length > 0) {
      throw new AppError(`You already have a leave request spanning this period (${overlapping[0].startDate} to ${overlapping[0].endDate}) in status '${overlapping[0].status}'.`, 409);
    }

    // 2. Calculate working days
    const { totalDays, workingDays } = await this.calculateLeaveDays(data.startDate, data.endDate);
    if (workingDays <= 0) {
      throw new AppError('The selected dates contain only weekends and/or public holidays. No working days required.', 400);
    }

    // 3. Check leave balance
    const year = new Date(data.startDate).getFullYear();
    const balance = await leaveRepository.getSpecificBalance(emp.id, leaveType.id, year);
    if (!balance) {
      throw new AppError(`No balance record configured for ${leaveType.name} in year ${year}.`, 400);
    }

    if (balance.remainingDays < workingDays) {
      throw new AppError(`Insufficient leave balance. You requested ${workingDays} working days, but only have ${balance.remainingDays} days remaining for ${leaveType.name}.`, 400);
    }

    // 4. Atomically update balance: add pending days
    await leaveRepository.updateBalance(balance.id, 0, workingDays);

    // 5. Create request record
    const request = await leaveRepository.createRequest({
      employeeId: emp.id,
      leaveTypeId: leaveType.id,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays,
      workingDays,
      reason: data.reason,
    });

    // 6. Notify manager
    if (emp.managerId) {
      const mgr = await employeeRepository.findById(emp.managerId);
      if (mgr && mgr.userId) {
        await notificationRepository.create({
          userId: mgr.userId,
          title: 'Action Required: Pending Leave Request',
          message: `${emp.firstName} ${emp.lastName} submitted a request for ${workingDays} days of ${leaveType.name} (${data.startDate} to ${data.endDate}).`,
          type: 'APPROVAL_REQUIRED',
          link: '/leave/requests',
        });
      }
    }

    // 7. Audit log
    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LEAVE_SUBMITTED',
      entity: 'LeaveRequest',
      entityId: request.id,
      metadata: {
        leaveType: leaveType.name,
        startDate: data.startDate,
        endDate: data.endDate,
        workingDays,
      },
    });

    // Invalidate caches
    await cache.invalidatePattern('dashboard:summary:*');
    await cache.invalidatePattern('analytics:*');

    return request;
  }

  async reviewLeave(
    requestId: string,
    action: 'APPROVE' | 'REJECT',
    comment: string | undefined,
    user: AuthenticatedUser
  ): Promise<LeaveRequest> {
    const request = await leaveRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    if (request.status !== 'PENDING') {
      throw new AppError(`Cannot review a request that is already in '${request.status}' state.`, 400);
    }

    // Authorization check: User must be HR, ADMIN, or the employee's assigned manager
    const reqEmp = await employeeRepository.findById(request.employeeId);
    if (!reqEmp) throw new AppError('Associated employee not found', 404);

    const isHrOrAdmin = user.role === 'HR' || user.role === 'ADMIN';
    const isDirectManager = user.employeeId && reqEmp.managerId === user.employeeId;

    if (!isHrOrAdmin && !isDirectManager) {
      throw new AppError('Forbidden: Only the direct manager, HR, or Admin can review this leave request.', 403);
    }

    if (action === 'REJECT' && (!comment || comment.trim().length < 5)) {
      throw new AppError('A clear explanation (at least 5 characters) is required when rejecting a leave request.', 422);
    }

    const year = new Date(request.startDate).getFullYear();
    const balance = await leaveRepository.getSpecificBalance(request.employeeId, request.leaveTypeId, year);
    if (!balance) {
      throw new AppError('Balance record not found', 500);
    }

    if (action === 'APPROVE') {
      // Pending -> Used
      await leaveRepository.updateBalance(balance.id, request.workingDays, -request.workingDays);
      await leaveRepository.updateRequestStatus(requestId, 'APPROVED', user.employeeId || null, comment || 'Approved');

      // Notify employee
      if (reqEmp.userId) {
        await notificationRepository.create({
          userId: reqEmp.userId,
          title: 'Leave Request Approved',
          message: `Your leave request for ${request.workingDays} days (${request.startDate} to ${request.endDate}) has been APPROVED.`,
          type: 'LEAVE_APPROVED',
          link: '/leave/requests',
        });
      }
    } else {
      // REJECT: release pending days back to balance
      await leaveRepository.updateBalance(balance.id, 0, -request.workingDays);
      await leaveRepository.updateRequestStatus(requestId, 'REJECTED', user.employeeId || null, comment || 'Rejected');

      // Notify employee
      if (reqEmp.userId) {
        await notificationRepository.create({
          userId: reqEmp.userId,
          title: 'Leave Request Rejected',
          message: `Your leave request for ${request.startDate} was rejected. Reason: ${comment}`,
          type: 'LEAVE_REJECTED',
          link: '/leave/requests',
        });
      }
    }

    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: action === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      entity: 'LeaveRequest',
      entityId: requestId,
      metadata: { action, comment, employee: `${reqEmp.firstName} ${reqEmp.lastName}` },
    });

    await cache.invalidatePattern('dashboard:summary:*');
    await cache.invalidatePattern('analytics:*');

    return (await leaveRepository.findRequestById(requestId))!;
  }

  async cancelLeave(requestId: string, user: AuthenticatedUser): Promise<LeaveRequest> {
    const request = await leaveRepository.findRequestById(requestId);
    if (!request) {
      throw new AppError('Leave request not found', 404);
    }

    const reqEmp = await employeeRepository.findById(request.employeeId);
    if (!reqEmp) throw new AppError('Associated employee not found', 404);

    const isOwner = user.employeeId && request.employeeId === user.employeeId;
    const isHrOrAdmin = user.role === 'HR' || user.role === 'ADMIN';

    if (!isOwner && !isHrOrAdmin) {
      throw new AppError('You can only cancel your own leave requests.', 403);
    }

    if (request.status === 'CANCELLED' || request.status === 'REJECTED') {
      throw new AppError(`Request is already ${request.status.toLowerCase()}.`, 400);
    }

    const year = new Date(request.startDate).getFullYear();
    const balance = await leaveRepository.getSpecificBalance(request.employeeId, request.leaveTypeId, year);
    if (!balance) throw new AppError('Balance record not found', 500);

    if (request.status === 'PENDING') {
      // Revert pending days
      await leaveRepository.updateBalance(balance.id, 0, -request.workingDays);
    } else if (request.status === 'APPROVED') {
      // Revert used days
      await leaveRepository.updateBalance(balance.id, -request.workingDays, 0);
    }

    await leaveRepository.updateRequestStatus(requestId, 'CANCELLED', user.employeeId || null, 'Cancelled by user');

    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'LEAVE_CANCELLED',
      entity: 'LeaveRequest',
      entityId: requestId,
    });

    await cache.invalidatePattern('dashboard:summary:*');
    await cache.invalidatePattern('analytics:*');

    return (await leaveRepository.findRequestById(requestId))!;
  }

  async listRequests(filters: LeaveRequestListFilters, user: AuthenticatedUser) {
    // Role-based scoping enforcement:
    // If EMPLOYEE: can only view their own requests
    // If MANAGER: can view own requests + team requests
    // If HR/ADMIN: can view all
    const scopedFilters: LeaveRequestListFilters = { ...filters };

    if (user.role === 'EMPLOYEE') {
      scopedFilters.employeeId = user.employeeId;
    } else if (user.role === 'MANAGER' && !scopedFilters.employeeId) {
      // Default to team requests if no specific employee selected
      scopedFilters.managerId = user.employeeId;
    }

    return leaveRepository.listRequests(scopedFilters);
  }
}

export const leaveService = new LeaveService();
