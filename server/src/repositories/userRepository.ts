import { db } from '../database/db.js';
import { User, UserRole, UserStatus } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

export class UserRepository {
  async findById(id: string): Promise<User | null> {
    return db.users.find(u => u.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim()) || null;
  }

  async create(data: { email: string; passwordHash: string; role: UserRole; status?: UserStatus }): Promise<User> {
    const newUser: User = {
      id: `user-${uuidv4().slice(0, 8)}`,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    return newUser;
  }

  async update(id: string, data: Partial<Pick<User, 'email' | 'passwordHash' | 'role' | 'status'>>): Promise<User | null> {
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;

    db.users[idx] = {
      ...db.users[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return db.users[idx];
  }

  async delete(id: string): Promise<boolean> {
    const idx = db.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    db.users.splice(idx, 1);
    return true;
  }

  async list(): Promise<User[]> {
    return [...db.users];
  }
}

export const userRepository = new UserRepository();
