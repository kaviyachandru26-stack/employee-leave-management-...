import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../services/leaveService.js';
import { leaveRepository } from '../repositories/leaveRepository.js';

export class LeaveController {
  async getTypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const types = await leaveService.getLeaveTypes();
      res.status(200).json({
        success: true,
        data: types,
      });
    } catch (err) {
      next(err);
    }
  }

  async createType(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const newType = await leaveRepository.createType(req.body);
      res.status(201).json({
        success: true,
        message: 'Leave type created successfully',
        data: newType,
      });
    } catch (err) {
      next(err);
    }
  }

  async calculateDays(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startDate, endDate } = req.body;
      const result = await leaveService.calculateLeaveDays(startDate, endDate);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyBalances(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.employeeId) {
        res.status(400).json({ success: false, message: 'User has no employee profile' });
        return;
      }
      const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();
      const balances = await leaveService.getEmployeeBalances(req.user.employeeId, year);
      res.status(200).json({
        success: true,
        data: balances,
      });
    } catch (err) {
      next(err);
    }
  }

  async listRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employeeId, departmentId, status, leaveTypeId, startDate, endDate, page, limit } = req.query;

      const result = await leaveService.listRequests({
        employeeId: employeeId as string,
        departmentId: departmentId as string,
        status: status as string,
        leaveTypeId: leaveTypeId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 10,
      }, req.user!);

      res.status(200).json({
        success: true,
        data: result.requests,
        meta: {
          total: result.total,
          totalPages: result.totalPages,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 10,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async getRequestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await leaveRepository.findRequestById(req.params.id);
      if (!request) {
        res.status(404).json({ success: false, message: 'Leave request not found' });
        return;
      }
      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async apply(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await leaveService.applyLeave(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: 'Leave request submitted successfully for manager approval',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { comment } = req.body;
      const request = await leaveService.reviewLeave(req.params.id, 'APPROVE', comment, req.user!);
      res.status(200).json({
        success: true,
        message: 'Leave request approved successfully',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async reject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { comment } = req.body;
      const request = await leaveService.reviewLeave(req.params.id, 'REJECT', comment, req.user!);
      res.status(200).json({
        success: true,
        message: 'Leave request rejected',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }

  async cancel(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const request = await leaveService.cancelLeave(req.params.id, req.user!);
      res.status(200).json({
        success: true,
        message: 'Leave request cancelled successfully',
        data: request,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const leaveController = new LeaveController();
