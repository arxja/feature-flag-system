import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/env.js';
import { logger, stream } from './utils/logger.js';
// import { errorHandler } from './middleware/errorHandler';
// import { notFoundHandler } from './middleware/notFound';

// Initialize Express
const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200,
}));

// Performance middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
app.use(morgan('combined', { stream }));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ready check
app.get('/ready', (req, res) => {
    res.status(200).json({ status: 'ready' });
});

// app.use('/api/flags', flagRoutes);
// app.use('/api/admin', adminRoutes);
// app.use('/api/auth', authRoutes);

// app.use(notFoundHandler);
// app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        // await connectDB();
        
        // await connectRedis();
        
        app.listen(config.PORT, () => {
            logger.info(`
            ⭐⭐⭐ Feature Flag System Started ⭐⭐⭐
            🚀 Server running on http://localhost:${config.PORT}
            📝 Environment: ${config.NODE_ENV}
            💾 Health check: http://localhost:${config.PORT}/health
            `);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer();

export default app;