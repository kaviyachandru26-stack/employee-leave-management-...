import { Request, Response, NextFunction } from 'express';
import { holidayService } from '../services/holidayService.js';

export class HolidayController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
      const holidays = await holidayService.listHolidays(year);
      res.status(200).json({
        success: true,
        data: holidays,
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const holiday = await holidayService.createHoliday(req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });
      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: holiday,
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await holidayService.updateHoliday(req.params.id, req.body, {
        id: req.user!.id,
        email: req.user!.email,
      });
      res.status(200).json({
        success: true,
        message: 'Holiday updated successfully',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await holidayService.deleteHoliday(req.params.id, {
        id: req.user!.id,
        email: req.user!.email,
      });
      res.status(200).json({
        success: true,
        message: 'Holiday deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const holidayController = new HolidayController();
