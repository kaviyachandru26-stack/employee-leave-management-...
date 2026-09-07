import { db } from '../database/db.js';
import { holidayRepository } from '../repositories/holidayRepository.js';
import { leaveRepository } from '../repositories/leaveRepository.js';
import { cache } from '../cache/redis.js';
import { AuthenticatedUser } from '../types/index.js';

export class AnalyticsService {
  async getDashboardSummary(user: AuthenticatedUser) {
    const cacheKey = `dashboard:summary:${user.id}:${user.role}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const todayStr = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    let data: any = { role: user.role };

    if (user.role === 'EMPLOYEE' && user.employeeId) {
      const balances = await leaveRepository.getBalancesByEmployee(user.employeeId, currentYear);
      const pendingRequests = db.leaveRequests.filter(r => r.employeeId === user.employeeId && r.status === 'PENDING');
      const todayAttendance = db.attendances.find(a => a.employeeId === user.employeeId && a.date === todayStr);
      const recentAttendance = db.attendances
        .filter(a => a.employeeId === user.employeeId)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 7)
        .map(a => db.getHydratedAttendance(a));
      
      const upcomingHolidays = db.holidays
        .filter(h => h.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 4);

      data = {
        ...data,
        leaveBalances: balances,
        pendingRequestsCount: pendingRequests.length,
        pendingRequests: pendingRequests.map(r => db.getHydratedLeaveRequest(r)),
        todayAttendance: todayAttendance ? db.getHydratedAttendance(todayAttendance) : null,
        recentAttendance,
        upcomingHolidays,
      };
    } else if (user.role === 'MANAGER' && user.employeeId) {
      const directReports = db.employees.filter(e => e.managerId === user.employeeId);
      const reportIds = new Set(directReports.map(e => e.id));

      const pendingTeamRequests = db.leaveRequests
        .filter(r => reportIds.has(r.employeeId) && r.status === 'PENDING')
        .map(r => db.getHydratedLeaveRequest(r));

      const teamAttendanceToday = db.attendances.filter(a => reportIds.has(a.employeeId) && a.date === todayStr);
      const presentCount = teamAttendanceToday.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const attendancePercentage = directReports.length > 0 ? Math.round((presentCount / directReports.length) * 100) : 100;

      const onLeaveToday = db.leaveRequests
        .filter(r => reportIds.has(r.employeeId) && r.status === 'APPROVED' && r.startDate <= todayStr && r.endDate >= todayStr)
        .map(r => db.getHydratedLeaveRequest(r));

      // 7-day attendance trend
      const trendData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayAtt = db.attendances.filter(a => reportIds.has(a.employeeId) && a.date === dStr);
        const dayPresent = dayAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        trendData.push({
          date: dStr.slice(5), // MM-DD
          present: dayPresent,
          total: directReports.length,
          rate: directReports.length ? Math.round((dayPresent / directReports.length) * 100) : 0,
        });
      }

      data = {
        ...data,
        teamSize: directReports.length,
        pendingApprovalsCount: pendingTeamRequests.length,
        pendingApprovals: pendingTeamRequests,
        teamAttendancePercentage: attendancePercentage,
        employeesOnLeaveToday: onLeaveToday,
        attendanceTrend: trendData,
      };
    } else {
      // HR and ADMIN
      const totalEmployees = db.employees.length;
      const todayAttendance = db.attendances.filter(a => a.date === todayStr);
      const presentToday = todayAttendance.filter(a => a.status === 'PRESENT').length;
      const lateToday = todayAttendance.filter(a => a.status === 'LATE').length;
      
      const onLeaveToday = db.leaveRequests
        .filter(r => r.status === 'APPROVED' && r.startDate <= todayStr && r.endDate >= todayStr);

      const absentToday = Math.max(0, totalEmployees - (presentToday + lateToday + onLeaveToday.length));
      const pendingTotal = db.leaveRequests.filter(r => r.status === 'PENDING').length;

      // Department breakdown
      const departmentStats = db.departments.map(dept => {
        const deptEmps = db.employees.filter(e => e.departmentId === dept.id);
        const deptIds = new Set(deptEmps.map(e => e.id));
        const deptTodayAtt = todayAttendance.filter(a => deptIds.has(a.employeeId));
        const deptPresent = deptTodayAtt.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;

        return {
          id: dept.id,
          name: dept.name,
          code: dept.code,
          employeeCount: deptEmps.length,
          presentCount: deptPresent,
          attendanceRate: deptEmps.length > 0 ? Math.round((deptPresent / deptEmps.length) * 100) : 100,
        };
      });

      // Leave utilization by type
      const leaveTypeStats = db.leaveTypes.map(lt => {
        const matchingBalances = db.leaveBalances.filter(b => b.leaveTypeId === lt.id && b.year === currentYear);
        const totalAllocated = matchingBalances.reduce((acc, b) => acc + b.allocatedDays, 0);
        const totalUsed = matchingBalances.reduce((acc, b) => acc + b.usedDays, 0);
        const totalPending = matchingBalances.reduce((acc, b) => acc + b.pendingDays, 0);

        return {
          id: lt.id,
          name: lt.name,
          code: lt.code,
          allocated: totalAllocated,
          used: totalUsed,
          pending: totalPending,
          utilizationRate: totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0,
        };
      });

      // Leave status distribution
      const statusCounts = {
        PENDING: db.leaveRequests.filter(r => r.status === 'PENDING').length,
        APPROVED: db.leaveRequests.filter(r => r.status === 'APPROVED').length,
        REJECTED: db.leaveRequests.filter(r => r.status === 'REJECTED').length,
        CANCELLED: db.leaveRequests.filter(r => r.status === 'CANCELLED').length,
      };

      // 14-day attendance trend
      const attendanceTrend = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const dayAtt = db.attendances.filter(a => a.date === dStr);
        const pres = dayAtt.filter(a => a.status === 'PRESENT').length;
        const late = dayAtt.filter(a => a.status === 'LATE').length;
        attendanceTrend.push({
          date: dStr.slice(5),
          fullDate: dStr,
          present: pres,
          late: late,
          rate: totalEmployees > 0 ? Math.round(((pres + late) / totalEmployees) * 100) : 0,
        });
      }

      data = {
        ...data,
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
        onLeaveTodayCount: onLeaveToday.length,
        pendingApprovalsCount: pendingTotal,
        departmentStats,
        leaveTypeStats,
        statusDistribution: statusCounts,
        attendanceTrend,
        recentAuditLogs: db.auditLogs.slice(0, 6),
      };
    }

    await cache.set(cacheKey, data, 120); // 2 minute cache
    return data;
  }

  async getAttendanceAnalytics(departmentId?: string) {
    let attendances = db.attendances.map(a => db.getHydratedAttendance(a));
    if (departmentId) {
      attendances = attendances.filter(a => a.employee?.departmentId === departmentId);
    }

    const totalRecords = attendances.length;
    const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
    const lateCount = attendances.filter(a => a.status === 'LATE').length;
    const halfDayCount = attendances.filter(a => a.status === 'HALF_DAY').length;

    const totalHours = attendances.reduce((acc, a) => acc + (a.workingHours || 0), 0);
    const avgWorkingHours = totalRecords > 0 ? Number((totalHours / totalRecords).toFixed(2)) : 0;
    const onTimeRate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

    return {
      totalRecords,
      presentCount,
      lateCount,
      halfDayCount,
      avgWorkingHours,
      onTimeRate,
    };
  }

  async getLeaveAnalytics(departmentId?: string) {
    let requests = db.leaveRequests.map(r => db.getHydratedLeaveRequest(r));
    if (departmentId) {
      requests = requests.filter(r => r.employee?.departmentId === departmentId);
    }

    const typeCounts: Record<string, number> = {};
    db.leaveTypes.forEach(lt => {
      typeCounts[lt.name] = 0;
    });

    requests.forEach(r => {
      if (r.leaveType?.name) {
        typeCounts[r.leaveType.name] = (typeCounts[r.leaveType.name] || 0) + r.workingDays;
      }
    });

    const statusCounts = {
      PENDING: requests.filter(r => r.status === 'PENDING').length,
      APPROVED: requests.filter(r => r.status === 'APPROVED').length,
      REJECTED: requests.filter(r => r.status === 'REJECTED').length,
      CANCELLED: requests.filter(r => r.status === 'CANCELLED').length,
    };

    return {
      totalRequests: requests.length,
      byType: Object.entries(typeCounts).map(([name, days]) => ({ name, days })),
      byStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    };
  }
}

export const analyticsService = new AnalyticsService();
