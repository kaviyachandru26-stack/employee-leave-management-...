import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository } from '../repositories/userRepository.js';
import { employeeRepository } from '../repositories/employeeRepository.js';
import { auditLogRepository } from '../repositories/auditLogRepository.js';
import { AppError } from '../middleware/errorHandler.js';
import { AuthTokens, User } from '../types/index.js';

export class AuthService {
  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    } as any);

    const refreshToken = jwt.sign({ userId: user.id }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    } as any);

    return { accessToken, refreshToken };
  }

  async login(email: string, password: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'ACTIVE') {
      throw new AppError(`Your account is currently ${user.status.toLowerCase()}. Please contact HR.`, 403);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const employee = await employeeRepository.findByUserId(user.id);
    const tokens = this.generateTokens(user);

    // Audit log
    await auditLogRepository.create({
      actorId: user.id,
      actorEmail: user.email,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      metadata: { role: user.role },
      ipAddress,
      userAgent,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: employee ? {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          departmentId: employee.departmentId,
          departmentName: employee.department?.name,
          position: employee.position,
          avatarUrl: employee.avatarUrl,
        } : undefined,
      },
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded: any = jwt.verify(token, config.jwt.refreshSecret);
      const user = await userRepository.findById(decoded.userId);
      if (!user || user.status !== 'ACTIVE') {
        throw new AppError('Invalid refresh token or inactive account', 401);
      }

      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      } as any);

      return { accessToken };
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  async logout(userId: string, email: string, ipAddress?: string, userAgent?: string): Promise<void> {
    await auditLogRepository.create({
      actorId: userId,
      actorEmail: email,
      action: 'USER_LOGOUT',
      entity: 'User',
      entityId: userId,
      ipAddress,
      userAgent,
    });
  }
}

export const authService = new AuthService();
