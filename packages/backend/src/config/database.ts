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
    const isAtlas = config.MONGODB_URI?.includes('mongodb+srv');
    
    const baseOptions: ConnectOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      retryReads: true,
    };
    
    if (isAtlas) {
      return {
        ...baseOptions,
        w: 'majority',
        readPreference: 'secondaryPreferred',
      };
    }
    
    return {
      ...baseOptions,
      w: 'majority',
      readPreference: 'primary',
    };
  }

  async connect(retries = 5, delay = 3000): Promise<void> {
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
    
    const maskedUri = config.MONGODB_URI?.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1***$4');
    logger.info(`Connecting to MongoDB: ${maskedUri}`);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await mongoose.connect(config.MONGODB_URI, this.getConnectionOptions());
        
        this.connectionState = 'connected';
        this.setupEventHandlers();
        
        const connectionInfo = {
          host: mongoose.connection.host,
          port: mongoose.connection.port,
          name: mongoose.connection.name,
          isAtlas: config.MONGODB_URI?.includes('mongodb+srv') || false,
        };
        
        logger.info(`✅ MongoDB connected successfully (attempt ${attempt}/${retries})`, connectionInfo);
        return;
        
      } catch (error) {
        logger.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}):`, error);
        
        if (attempt === retries) {
          this.connectionState = 'disconnected';
          
          const errorMessage = error instanceof Error ? error.message : '';
          if (errorMessage.includes('bad auth')) {
            throw new Error('Authentication failed. Check your username and password in MONGODB_URI');
          }
          if (errorMessage.includes('getaddrinfo') || errorMessage.includes('ENOTFOUND')) {
            throw new Error('Network error. Check your internet connection and Atlas cluster name');
          }
          if (errorMessage.includes('whitelist')) {
            throw new Error('IP not whitelisted. Go to Atlas Network Access and add your IP (0.0.0.0/0 for development)');
          }
          
          throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${errorMessage}`);
        }
        
        logger.info(`Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
  }
  private signalHandlersRegistered = false;
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

    if(!this.signalHandlersRegistered) {
      this.signalHandlersRegistered = true;
      process.on("SIGINT", async () => {
        await this.disconnect();
        process.exit(0);
      });
      process.on("SIGTERM", async () => {
        await this.disconnect();
        process.exit(0);
      })
    }
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