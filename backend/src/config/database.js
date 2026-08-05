const mongoose = require('mongoose');
const logger = require('./logger');

let mongod;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri || uri === 'memory') {
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
  logger.error(`MongoDB error: ${err}`);
});

module.exports = { connectDB, disconnectDB };
