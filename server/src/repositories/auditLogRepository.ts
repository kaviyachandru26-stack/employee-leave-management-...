import { db } from '../database/db.js';
import { AuditLog } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export interface AuditLogFilters {
  actorId?: string;
  entity?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class AuditLogRepository {
  async list(filters: AuditLogFilters = {}): Promise<{ logs: AuditLog[]; total: number; totalPages: number }> {
    let list = [...db.auditLogs];

    if (filters.actorId) {
      list = list.filter(l => l.actorId === filters.actorId);
    }

    if (filters.entity) {
      list = list.filter(l => l.entity.toLowerCase() === filters.entity!.toLowerCase());
    }

    if (filters.action) {
      list = list.filter(l => l.action.toLowerCase().includes(filters.action!.toLowerCase()));
    }

    if (filters.startDate) {
      list = list.filter(l => l.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      list = list.filter(l => l.createdAt <= filters.endDate!);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 20);
    const totalPages = Math.ceil(total / limit) || 1;
    const paginated = list.slice((page - 1) * limit, page * limit);

    return {
      logs: paginated,
      total,
      totalPages,
    };
  }

  async create(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const log: AuditLog = {
      ...data,
      id: `aud-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    db.auditLogs.unshift(log);
    return log;
  }
}

export const auditLogRepository = new AuditLogRepository();
