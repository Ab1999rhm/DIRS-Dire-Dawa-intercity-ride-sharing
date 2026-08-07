const mongoose = require('mongoose');
const logger = require('./logger');

let mongod;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      logger.error('MONGODB_URI is not set');
      process.exit(1);
    }

    logger.info('Connecting to MongoDB...');

    if (uri === 'memory') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      logger.info(`MongoDB Memory Server Connected: ${memUri}`);
    } else {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        tls: true,
        tlsAllowInvalidCertificates: true,
      });
      logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
    }
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    logger.error(`Error name: ${error.name}`);
    if (error.stack) logger.error(`Stack: ${error.stack}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = { connectDB, disconnectDB };
