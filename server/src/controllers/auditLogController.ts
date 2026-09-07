import { Request, Response, NextFunction } from 'express';
import { auditLogRepository } from '../repositories/auditLogRepository.js';

export class AuditLogController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { actorId, entity, action, startDate, endDate, page, limit } = req.query;

      const result = await auditLogRepository.list({
        actorId: actorId as string,
        entity: entity as string,
        action: action as string,
        startDate: startDate as string,
        endDate: endDate as string,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      res.status(200).json({
        success: true,
        data: result.logs,
        meta: {
          total: result.total,
          totalPages: result.totalPages,
          page: page ? parseInt(page as string, 10) : 1,
          limit: limit ? parseInt(limit as string, 10) : 20,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const auditLogController = new AuditLogController();
