import { Request, Response, NextFunction } from 'express';
import { notificationRepository } from '../repositories/notificationRepository.js';

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const list = await notificationRepository.listByUser(req.user!.id);
      const unreadCount = await notificationRepository.getUnreadCount(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          notifications: list,
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await notificationRepository.markAsRead(req.params.id, req.user!.id);
      if (!updated) {
        res.status(404).json({ success: false, message: 'Notification not found' });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Marked as read',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const count = await notificationRepository.markAllAsRead(req.user!.id);
      res.status(200).json({
        success: true,
        message: `Marked ${count} notifications as read`,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
