import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import { logger, stream } from './utils/logger.js';
import { db } from './config/database.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
}));

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan('combined', { stream }));

// Rate limiting (only if config values exist)
if (config.RATE_LIMIT_WINDOW_MS && config.RATE_LIMIT_MAX_REQUESTS) {
    const limiter = rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        max: config.RATE_LIMIT_MAX_REQUESTS,
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false,
    });
    app.use('/api', limiter);
    logger.info('Rate limiting enabled');
} else {
    logger.warn('Rate limiting disabled - missing configuration');
}

// Health check
app.get('/health', (req, res) => {
    const dbState = mongoose.connection.readyState;
    const dbStateMap = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized'
    };
    
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
            state: dbStateMap[dbState] || 'unknown',
            readyState: dbState,
        },
        environment: config.NODE_ENV,
    });
});

// Ready check
app.get('/ready', async (req, res) => {
    const dbState = mongoose.connection.readyState;
    
    if (dbState !== 1) {
        const dbStateMap: any = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting',
        };
        
        res.status(503).json({ 
            status: 'not ready', 
            reason: `database ${dbStateMap[dbState] || 'uninitialized'}`,
            readyState: dbState,
            timestamp: new Date().toISOString(),
        });
        return;
    }
    
    try {
        await mongoose.connection.db.admin().ping();
        res.status(200).json({ 
            status: 'ready',
            timestamp: new Date().toISOString(),
            database: 'responsive',
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'not ready', 
            reason: 'database not responsive',
            error: error instanceof Error ? error.message : 'unknown error',
        });
    }
});

app.get('/api/ping', (req, res) => {
    res.json({ 
        message: 'pong', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// Start server
const startServer = async () => {
    try {
        if (!config.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }
        
        logger.info(`Starting server in ${config.NODE_ENV || 'development'} mode`);
        logger.info(`Connecting to MongoDB: ${config.MONGODB_URI.replace(/\/\/(.*)@/, '//***:***@')}`); // Hide credentials in logs
        
        await db.connect();
        
        const server = app.listen(config.PORT, () => {
            logger.info(`
╔══════════════════════════════════════════════════════════╗
║     🚀 Feature Flag System - Production Ready           ║
╠══════════════════════════════════════════════════════════╣
║  Server:    http://localhost:${config.PORT}                   ║
║  Health:    http://localhost:${config.PORT}/health           ║
║  Ready:     http://localhost:${config.PORT}/ready            ║
║  Ping:      http://localhost:${config.PORT}/api/ping         ║
║  Environment: ${(config.NODE_ENV || 'development').padEnd(36)}║
║  Database:  ${mongoose.connection.readyState === 1 ? '✅ Connected'.padEnd(36) : '❌ Disconnected'.padEnd(36)}║
╚══════════════════════════════════════════════════════════╝
            `);
        });
        
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, shutting down gracefully...`);
            
            // Set a timeout to force exit after 10 seconds
            const forceExit = setTimeout(() => {
                logger.error('Forced shutdown after 10s - exiting now');
                process.exit(1);
            }, 10000);
            
            server.close(async (err?: Error) => {
                if (err) {
                    logger.error('Error closing server:', err);
                    clearTimeout(forceExit);
                    process.exit(1);
                }
                
                try {
                    await db.disconnect();
                    logger.info('Server shutdown complete');
                    clearTimeout(forceExit);
                    process.exit(0);
                } catch (error) {
                    logger.error('Error during disconnect:', error);
                    clearTimeout(forceExit);
                    process.exit(1);
                }
            });
        };
        
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

startServer();

export default app;