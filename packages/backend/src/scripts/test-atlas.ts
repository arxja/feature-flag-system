import { config } from '../config/env.js';
import { db, mongoose } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function testAtlasConnection() {
  logger.info('🧪 Testing MongoDB Atlas connection...');
  
  const maskedUri = config.MONGODB_URI?.replace(/(mongodb(\+srv)?:\/\/[^:]+:)([^@]+)(@.+)/, '$1***$4');
  logger.info(`Connection URI: ${maskedUri}`);
  
  try {
    await db.connect();
    
    if (!mongoose.connection.db) {
      throw new Error('Database connection object not initialized');
    }
    
    // Test list collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    logger.info(`✅ Connected! Found ${collections.length} collections`);
    
    // Test write operation
    const testCollection = mongoose.connection.db.collection('_test_connection');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    logger.info('✅ Write operation successful');
    
    // Test read operation
    const doc = await testCollection.findOne({ test: true });
    logger.info('✅ Read operation successful');
    
    // Test update operation
    await testCollection.updateOne(
      { test: true },
      { $set: { updated: true, updatedAt: new Date() } }
    );
    logger.info('✅ Update operation successful');
    
    // Test delete operation
    await testCollection.deleteOne({ test: true });
    logger.info('✅ Delete operation successful');
    
    // Clean up
    await testCollection.drop();
    logger.info('✅ Cleanup successful');
    
    logger.info('🎉 All Atlas tests passed! Your connection is working perfectly.');
    
  } catch (error) {
    logger.error('❌ Connection test failed:', error);
    
    if (error instanceof Error) {
      const errorMessage = error.message;
      
      if (errorMessage.includes('bad auth') || errorMessage.includes('Authentication failed')) {
        logger.error(`
        🔧 SOLUTION: Wrong password or username
        1. Check your password in MONGODB_URI
        2. If you forgot password, reset in Atlas: 
          Database Access > Edit user > Reset password
        3. Make sure the database user exists and has proper permissions
        `);
      } 
      else if (errorMessage.includes('whitelist') || errorMessage.includes('IP address')) {
        logger.error(`
        🔧 SOLUTION: IP not whitelisted in Atlas
        1. Go to MongoDB Atlas: Network Access > Add IP Address
        2. Add 0.0.0.0/0 (allows any IP - for development only)
        3. Wait 1-2 minutes for changes to apply
        `);
      } 
      else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo') || errorMessage.includes('querySrv')) {
        logger.error(`
        🔧 SOLUTION: Wrong cluster name or network issue
        1. Check your cluster name in the connection string
        2. Format should be: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/
        3. Get correct URI from Atlas: Connect > Connect your application
        4. Check if you have internet access to MongoDB Atlas
        `);
      }
      else if (errorMessage.includes('timeout') || errorMessage.includes('Timed out')) {
        logger.error(`
        🔧 SOLUTION: Connection timeout
        1. Check your internet connection
        2. Try using a different network
        3. Increase serverSelectionTimeoutMS in database config
        4. Check if MongoDB Atlas is operational: https://status.mongodb.com/
        `);
      }
      else if (errorMessage.includes('database name')) {
        logger.error(`
        🔧 SOLUTION: Missing or invalid database name
        1. Make sure your URI includes a database name: mongodb+srv://user:pass@cluster/dbname
        2. The database will be created automatically if it doesn't exist
        `);
      }
    }
  } finally {
    await db.disconnect();
    logger.info('Test completed, database connection closed');
  }
}

testAtlasConnection();