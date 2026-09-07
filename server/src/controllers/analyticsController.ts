import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analyticsService.js';

export class AnalyticsController {
  async getDashboardSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await analyticsService.getDashboardSummary(req.user!);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  async getAttendanceAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId } = req.query;
      const data = await analyticsService.getAttendanceAnalytics(departmentId as string);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeaveAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { departmentId } = req.query;
      const data = await analyticsService.getLeaveAnalytics(departmentId as string);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const analyticsController = new AnalyticsController();
