require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { connectDB } = require('./config/database');
const { initializeSocket } = require('./sockets/socketManager');
const { securityMiddleware } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const { setupSwagger } = require('./config/swagger');
const logger = require('./config/logger');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

connectDB();
initializeSocket(server);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:", "https://*.tile.openstreetmap.org"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.tile.openstreetmap.org"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"]
    },
    reportOnly: false
  },
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 0 }
}));

app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      process.env.PASSENGER_APP_URL,
      process.env.DRIVER_APP_URL,
      process.env.ADMIN_APP_URL,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Allow all in dev, restrict in production
    }
  },
  credentials: true
}));

app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

securityMiddleware(app);

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/'
});
app.use('/api/', generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => ['/me', '/refresh-token'].includes(req.path)
});
app.use('/api/auth/', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/rides', require('./routes/rides'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/ratings', require('./routes/ratings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/sos', require('./routes/sos'));
app.use('/api/safety', require('./routes/safety'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/uploads', express.static(uploadsDir));

setupSwagger(app);

app.get('/api/health', async (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.json({
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'DIRS Backend',
    database: dbStatus,
    uptime: process.uptime()
  });
});

// TEMPORARY: Seed places endpoint (remove after running once)
app.get('/api/seed-places', async (req, res) => {
  const Place = require('./models/Place');
  const INTERCITY = [
    { name: 'Harar', key: 'harar', emoji: '🕌', lat: 9.3115, lon: 42.1199 },
    { name: 'Addis Ababa', key: 'addis ababa', emoji: '🏔', lat: 9.0192, lon: 38.7525 },
    { name: 'Jijiga', key: 'jijiga', emoji: '🏟', lat: 9.3506, lon: 42.7933 },
    { name: 'Combolcha', key: 'combolcha', emoji: '⛰', lat: 8.9300, lon: 39.8700 },
    { name: 'Awash', key: 'awash', emoji: '🌿', lat: 8.9833, lon: 40.1500 },
    { name: 'Debre Markos', key: 'debre markos', emoji: '⛪', lat: 10.3400, lon: 37.7300 },
    { name: 'Adama (Nazret)', key: 'adama', emoji: '🏨', lat: 8.5400, lon: 39.2700 },
    { name: 'Hawassa', key: 'hawassa', emoji: '🌊', lat: 7.0621, lon: 38.4763 },
    { name: 'Bahir Dar', key: 'bahir dar', emoji: '🏨', lat: 11.5938, lon: 37.3909 },
    { name: 'Mekelle', key: 'mekelle', emoji: '🏔', lat: 13.4967, lon: 39.4753 },
    { name: 'Jimma', key: 'jimma', emoji: '🌳', lat: 7.6789, lon: 36.8340 },
    { name: 'Dessie', key: 'dessie', emoji: '🏔', lat: 11.1321, lon: 39.6353 },
    { name: 'Chiro', key: 'chiro', emoji: '🌽', lat: 9.0667, lon: 40.8667 },
    { name: 'Asebe Teferi', key: 'asebe teferi', emoji: '🌽', lat: 9.0667, lon: 40.8667 },
  ];
  const INTRA = [
    { name: 'Sabian', key: 'sabian', lat: 9.5950, lon: 41.8600, category: 'neighborhood' },
    { name: 'Kezira', key: 'kezira', lat: 9.6080, lon: 41.8450, category: 'neighborhood' },
    { name: 'Addis Ketema', key: 'addis ketema', lat: 9.5990, lon: 41.8530, category: 'neighborhood' },
    { name: 'Gendekore', key: 'gendekore', lat: 9.6120, lon: 41.8390, category: 'neighborhood' },
    { name: 'Dire Dawa City Center', key: 'city center', lat: 9.6009, lon: 41.8508, category: 'landmark' },
    { name: 'Melka Jebdu', key: 'melka jebdu', lat: 9.5880, lon: 41.8700, category: 'neighborhood' },
    { name: 'Legehare', key: 'legehare', lat: 9.6050, lon: 41.8470, category: 'neighborhood' },
    { name: 'Taiwan', key: 'taiwan', lat: 9.6030, lon: 41.8540, category: 'neighborhood' },
    { name: 'Ashewa', key: 'ashewa', lat: 9.6090, lon: 41.8610, category: 'neighborhood' },
    { name: 'Megala', key: 'megala', lat: 9.5910, lon: 41.8650, category: 'neighborhood' },
    { name: 'Buramedo', key: 'buramedo', lat: 9.5870, lon: 41.8430, category: 'neighborhood' },
    { name: 'Kebele 01', key: 'kebele 01', lat: 9.6015, lon: 41.8495, category: 'neighborhood' },
    { name: 'Kebele 05', key: 'kebele 05', lat: 9.6035, lon: 41.8515, category: 'neighborhood' },
    { name: 'Kebele 08', key: 'kebele 08', lat: 9.5970, lon: 41.8560, category: 'neighborhood' },
    { name: 'Dire Dawa Market', key: 'dire dawa market', lat: 9.6010, lon: 41.8500, category: 'market' },
    { name: 'Kezira Market', key: 'kezira market', lat: 9.6070, lon: 41.8460, category: 'market' },
    { name: 'Shoa Market', key: 'shoa market', lat: 9.6005, lon: 41.8510, category: 'market' },
    { name: 'Mekonisa Market', key: 'mekonisa market', lat: 9.6025, lon: 41.8520, category: 'market' },
    { name: 'Dire Dawa Hospital', key: 'dire dawa hospital', lat: 9.6012, lon: 41.8485, category: 'hospital' },
    { name: 'Sabian Health Center', key: 'sabian health center', lat: 9.5945, lon: 41.8595, category: 'hospital' },
    { name: 'Kezira Health Center', key: 'kezira health center', lat: 9.6075, lon: 41.8455, category: 'hospital' },
    { name: 'Dire Dawa Polytechnic', key: 'polytechnic', lat: 9.6040, lon: 41.8490, category: 'school' },
    { name: 'Mekane Yesus School', key: 'mekane yesus', lat: 9.6000, lon: 41.8515, category: 'school' },
    { name: 'Dire Dawa Bus Station', key: 'bus station', lat: 9.6018, lon: 41.8508, category: 'transport' },
    { name: 'Dire Dawa Airport', key: 'airport', lat: 9.6247, lon: 41.8542, category: 'transport' },
    { name: 'Samrat Hotel', key: 'samrat hotel', lat: 9.6018, lon: 41.8488, category: 'hotel' },
    { name: 'Ras Hotel', key: 'ras hotel', lat: 9.6022, lon: 41.8505, category: 'hotel' },
    { name: 'Ethiopia Hotel', key: 'ethiopia hotel', lat: 9.6012, lon: 41.8498, category: 'hotel' },
    { name: 'Dire Dawa City Administration', key: 'city administration', lat: 9.6008, lon: 41.8492, category: 'government' },
    { name: 'Dire Dawa Police Station', key: 'police station', lat: 9.6002, lon: 41.8478, category: 'government' },
    { name: 'Dire Dawa Post Office', key: 'post office', lat: 9.6011, lon: 41.8501, category: 'government' },
    { name: 'Commercial Bank of Ethiopia', key: 'cbe dire dawa', lat: 9.6015, lon: 41.8505, category: 'government' },
    { name: 'Awash Bank Dire Dawa', key: 'awash bank dire dawa', lat: 9.6020, lon: 41.8510, category: 'government' },
    { name: 'Dire Dawa Stadium', key: 'stadium', lat: 9.6085, lon: 41.8440, category: 'landmark' },
    { name: 'Central Mosque', key: 'central mosque', lat: 9.6009, lon: 41.8520, category: 'landmark' },
    { name: 'St. Gabriel Church', key: 'st gabriel church', lat: 9.5995, lon: 41.8490, category: 'landmark' },
  ];
  try {
    let interCreated = 0, intraCreated = 0;
    for (const p of INTERCITY) {
      const exists = await Place.findOne({ key: p.key, type: 'intercity' });
      if (!exists) {
        await Place.create({ name: p.name, type: 'intercity', key: p.key, label: p.name + ', Ethiopia', emoji: p.emoji, coordinates: { lat: p.lat, lon: p.lon }, city: p.name, category: 'city', isActive: true });
        interCreated++;
      }
    }
    for (const p of INTRA) {
      const exists = await Place.findOne({ key: p.key, type: 'intra_city' });
      if (!exists) {
        await Place.create({ name: p.name, type: 'intra_city', key: p.key, label: p.name + ', Dire Dawa', coordinates: { lat: p.lat, lon: p.lon }, city: 'Dire Dawa', category: p.category, isActive: true });
        intraCreated++;
      }
    }
    res.json({ success: true, message: `Seeded ${interCreated} intercity + ${intraCreated} intra-city places` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('*', (req, res) => { res.status(404).json({ error: 'Route not found' }); });

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const gracefulShutdown = (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');

    const mongoose = require('mongoose');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', { reason: reason?.message || reason, stack: reason?.stack });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException');
});

server.listen(PORT, () => {
  logger.info(`DIRS Backend running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  const { startKeepAlive } = require('./services/keepAlive');
  startKeepAlive();
  const { startWithdrawalReconciliation } = require('./services/withdrawalReconciliation');
  startWithdrawalReconciliation();
});

module.exports = { app, server };
