import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../services/attendanceService.js';

export class AttendanceController {
  async getTodayStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.employeeId) {
        res.status(400).json({ success: false, message: 'No employee record associated' });
        return;
      }
      const record = await attendanceService.getTodayStatus(req.user.employeeId);
      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async checkIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await attendanceService.checkIn(req.user!, req.body.notes);
      res.status(200).json({
        success: true,
        message: 'Punch In recorded successfully',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async checkOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const record = await attendanceService.checkOut(req.user!, req.body.notes);
      res.status(200).json({
        success: true,
        message: 'Punch Out recorded successfully',
        data: record,
      });
    } catch (err) {
      next(err);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, departmentId, date, startDate, endDate, status, page, limit } = req.query;

      const result = await attendanceService.listAttendance({
        employeeId: employeeId as string,
        departmentId: departmentId as string,
        date: date as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
      }, req.user!);

      res.status(200).json({
        success: true,
        data: result.attendances,
        meta: {
          total: result.total,
          totalPages: result.totalPages,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 15,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getTeamAttendance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { date, startDate, endDate, status, page, limit } = req.query;
      const result = await attendanceService.listAttendance({
        managerId: req.user?.employeeId,
        date: date as string,
        startDate: startDate as string,
        endDate: endDate as string,
        status: status as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 15,
      }, req.user!);

      res.status(200).json({
        success: true,
        data: result.attendances,
        meta: {
          total: result.total,
          totalPages: result.totalPages,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 15,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const attendanceController = new AttendanceController();
