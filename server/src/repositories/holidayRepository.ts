import { db } from '../database/db.js';
import { Holiday, HolidayType } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class HolidayRepository {
  async findById(id: string): Promise<Holiday | null> {
    return db.holidays.find(h => h.id === id) || null;
  }

  async findByDate(date: string): Promise<Holiday | null> {
    return db.holidays.find(h => h.date === date) || null;
  }

  async list(year?: number): Promise<Holiday[]> {
    let list = [...db.holidays];
    if (year) {
      list = list.filter(h => h.date.startsWith(`${year}-`));
    }
    // Sort chronological
    list.sort((a, b) => a.date.localeCompare(b.date));
    return list;
  }

  async create(data: { name: string; date: string; type: HolidayType; description: string }): Promise<Holiday> {
    const existing = await this.findByDate(data.date);
    if (existing) {
      throw new Error(`A holiday already exists for date: ${data.date} (${existing.name})`);
    }

    const newHol: Holiday = {
      id: `hol-${uuidv4().slice(0, 8)}`,
      name: data.name.trim(),
      date: data.date,
      type: data.type,
      description: data.description.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.holidays.push(newHol);
    return newHol;
  }

  async update(id: string, data: Partial<Pick<Holiday, 'name' | 'date' | 'type' | 'description'>>): Promise<Holiday | null> {
    const idx = db.holidays.findIndex(h => h.id === id);
    if (idx === -1) return null;

    if (data.date && data.date !== db.holidays[idx].date) {
      const existing = await this.findByDate(data.date);
      if (existing && existing.id !== id) {
        throw new Error(`Another holiday already exists for date: ${data.date}`);
      }
    }

    db.holidays[idx] = {
      ...db.holidays[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return db.holidays[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = db.holidays.findIndex(h => h.id === id);
    if (idx === -1) return false;
    db.holidays.splice(idx, 1);
    return true;
  }
}

export const holidayRepository = new HolidayRepository();
