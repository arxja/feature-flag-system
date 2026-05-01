import mongoose, { ConnectOptions } from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

class MongoDBConnection {
    private static instance: MongoDBConnection;
    private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

    private constructor() {}

    static getInstance(): MongoDBConnection {
        if (!MongoDBConnection.instance) {
            MongoDBConnection.instance = new MongoDBConnection();
        }
        return MongoDBConnection.instance;
    }

    private getConnectionOptions(): ConnectOptions {
        return {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        retryReads: true,
        w: 'majority',
        readPreference: 'primary',
        };
    }

    async connect(retries = 3, delay = 5000): Promise<void> {
        if (this.connectionState === 'connected') {
            logger.info('MongoDB already connected');
        return;
        }
        if (this.connectionState === 'connecting') {
            logger.info('MongoDB connection already in progress, waiting...');
            await this.waitForConnection();
            return;
        }
        this.connectionState = 'connecting';
        logger.info(`Connecting to MongoDB at ${config.MONGODB_URI?.replace(/\/\/(.*)@/, '//***:***@')}`);
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                await mongoose.connect(config.MONGODB_URI, this.getConnectionOptions());
                
                this.connectionState = 'connected';
                this.setupEventHandlers();
                
                logger.info(`✅ MongoDB connected successfully (attempt ${attempt}/${retries})`);
                return;
            } catch (error) {
                logger.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}):`, error);
                
                if (attempt === retries) {
                    this.connectionState = 'disconnected';
                    throw new Error(`Failed to connect to MongoDB after ${retries} attempts`);
                }
                
                logger.info(`Retrying in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
    }

    private setupEventHandlers(): void {
        mongoose.connection.removeAllListeners();
        mongoose.connection.on('connected', () => {
            logger.info('Mongoose connected to MongoDB');
        });
        mongoose.connection.on('error', (error) => {
            logger.error('Mongoose connection error:', error);
            this.connectionState = 'disconnected';
        });
        mongoose.connection.on('disconnected', () => {
            logger.warn('Mongoose disconnected from MongoDB');
            this.connectionState = 'disconnected';
        });
        process.on('SIGINT', async () => {
            await this.disconnect();
            process.exit(0);
        });
        process.on('SIGTERM', async () => {
            await this.disconnect();
            process.exit(0);
        });
    }
    private async waitForConnection(): Promise<void> {
        while (this.connectionState === 'connecting') {
            await this.sleep(100);
        }
    }
    async disconnect(): Promise<void> {
        if (this.connectionState === 'disconnected') return;
        logger.info('Disconnecting from MongoDB...');
        try {
            await mongoose.disconnect();
            this.connectionState = 'disconnected';
            logger.info('MongoDB disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    isConnected(): boolean {
        return this.connectionState === 'connected' && mongoose.connection.readyState === 1;
    }
    getConnection() {
        return mongoose.connection;
    }
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export const db = MongoDBConnection.getInstance();

export { mongoose };