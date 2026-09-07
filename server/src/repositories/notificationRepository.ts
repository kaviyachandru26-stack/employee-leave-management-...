import { db } from '../database/db.js';
import { Notification, NotificationType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class NotificationRepository {
  async listByUser(userId: string): Promise<Notification[]> {
    return db.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnreadCount(userId: string): Promise<number> {
    return db.notifications.filter(n => n.userId === userId && !n.isRead).length;
  }

  async create(data: { userId: string; title: string; message: string; type: NotificationType; link?: string }): Promise<Notification> {
    const notif: Notification = {
      id: `notif-${uuidv4().slice(0, 8)}`,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      isRead: false,
      link: data.link,
      createdAt: new Date().toISOString(),
    };
    db.notifications.unshift(notif);
    return notif;
  }

  async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notif = db.notifications.find(n => n.id === id && n.userId === userId);
    if (!notif) return null;
    notif.isRead = true;
    return notif;
  }

  async markAllAsRead(userId: string): Promise<number> {
    let count = 0;
    db.notifications.forEach(n => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    return count;
  }
}

export const notificationRepository = new NotificationRepository();
