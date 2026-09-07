import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwt: {
    secret: process.env.JWT_SECRET || 'hrflow_jwt_access_secret_production_key_32bytes',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'hrflow_jwt_refresh_secret_production_key_32bytes',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres_password@localhost:5432/hrflow_db?schema=public',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://:redis_password@localhost:6379',
    defaultTtl: 300, // 5 minutes
  },
  cors: {
    origin: process.env.CLIENT_URL || true,
    credentials: true,
  },
};
