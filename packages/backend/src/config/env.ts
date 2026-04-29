import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '3001'),
    
    // Database
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/feature_flags?authSource=admin',
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || 'feature_flags',
    
    // Redis
    REDIS_URL: process.env.REDIS_URL || 'redis://:redis123@localhost:6379',
    
    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'super-secret-key-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
    
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    
    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    
    // CORS
    CORS_ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    
    // Feature Flags defaults
    DEFAULT_CACHE_TTL: parseInt(process.env.DEFAULT_CACHE_TTL || '30000'), // 30 seconds
    MAX_FLAGS_PER_REQUEST: parseInt(process.env.MAX_FLAGS_PER_REQUEST || '100'),
};

const requiredEnvVars = ['JWT_SECRET'];
if (config.NODE_ENV === 'production') {
    requiredEnvVars.forEach(envVar => {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`);
        }
    });
}