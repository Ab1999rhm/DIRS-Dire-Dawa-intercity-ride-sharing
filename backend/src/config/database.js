const mongoose = require('mongoose');
const dns = require('dns');
const logger = require('./logger');

let mongod;

function srvToDirect(uri) {
  const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)(\/.*)?$/);
  if (!match) return null;
  const [, user, pass, host, rest] = match;
  return new Promise((resolve, reject) => {
    dns.resolveSrv(`_mongodb._tcp.${host}`, (err, records) => {
      if (err) return reject(err);
      const hosts = records.map(r => `${r.name}:${r.port}`).join(',');
      resolve(`mongodb://${user}:${pass}@${hosts}${rest || ''}`);
    });
  });
}

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      logger.error('MONGODB_URI is not set');
      process.exit(1);
    }

    logger.info('Connecting to MongoDB...');
    logger.info(`URI starts with: ${uri.substring(0, 20)}...`);

    if (uri === 'memory') {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongod = await MongoMemoryServer.create();
      const memUri = mongod.getUri();
      await mongoose.connect(memUri);
      logger.info(`MongoDB Memory Server Connected: ${memUri}`);
    } else {
      const options = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
      };

      try {
        await mongoose.connect(uri, options);
        logger.info(`MongoDB Connected: ${mongoose.connection.host}`);
      } catch (firstError) {
        logger.warn(`First connection attempt failed: ${firstError.message}`);
        if (uri.startsWith('mongodb+srv')) {
          logger.info('Attempting DNS SRV resolution to direct connection...');
          try {
            const directUri = await srvToDirect(uri);
            if (directUri) {
              logger.info('Resolved to direct connection, retrying...');
              await mongoose.connect(directUri, options);
              logger.info(`MongoDB Connected via direct: ${mongoose.connection.host}`);
            } else {
              throw firstError;
            }
          } catch (srvError) {
            logger.error(`SRV resolution also failed: ${srvError.message}`);
            throw firstError;
          }
        } else {
          throw firstError;
        }
      }
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
