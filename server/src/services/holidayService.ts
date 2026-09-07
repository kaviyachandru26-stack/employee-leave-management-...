import { holidayRepository } from '../repositories/holidayRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { cache } from '../cache/redis.js';
import { AppError } from '../middleware/errorHandler.js';
import { Holiday, HolidayType } from '../types/index.js';

export class HolidayService {
  async listHolidays(year?: number): Promise<Holiday[]> {
    const cacheKey = `holidays:list:${year || 'all'}`;
    const cached = await cache.get<Holiday[]>(cacheKey);
    if (cached) return cached;

    const list = await holidayRepository.list(year);
    await cache.set(cacheKey, list, 3600); // 1 hour TTL
    return list;
  }

  async createHoliday(
    data: { name: string; date: string; type: HolidayType; description: string },
    actor: { id: string; email: string }
  ): Promise<Holiday> {
    const hol = await holidayRepository.create(data);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'HOLIDAY_CREATED',
      entity: 'Holiday',
      entityId: hol.id,
      metadata: { name: hol.name, date: hol.date },
    });

    await cache.invalidatePattern('holidays:*');
    return hol;
  }

  async updateHoliday(
    id: string,
    data: Partial<Pick<Holiday, 'name' | 'date' | 'type' | 'description'>>,
    actor: { id: string; email: string }
  ): Promise<Holiday> {
    const updated = await holidayRepository.update(id, data);
    if (!updated) {
      throw new AppError('Holiday not found', 404);
    }

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'HOLIDAY_UPDATED',
      entity: 'Holiday',
      entityId: id,
      metadata: data,
    });

    await cache.invalidatePattern('holidays:*');
    return updated;
  }

  async deleteHoliday(id: string, actor: { id: string; email: string }): Promise<void> {
    const existing = await holidayRepository.findById(id);
    if (!existing) {
      throw new AppError('Holiday not found', 404);
    }

    await holidayRepository.delete(id);

    await auditLogRepository.create({
      actorId: actor.id,
      actorEmail: actor.email,
      action: 'HOLIDAY_DELETED',
      entity: 'Holiday',
      entityId: id,
      metadata: { name: existing.name, date: existing.date },
    });

    await cache.invalidatePattern('holidays:*');
  }
}

export const holidayService = new HolidayService();
