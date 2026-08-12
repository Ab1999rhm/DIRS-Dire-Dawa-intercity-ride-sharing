const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const SuspiciousActivity = require('../models/SuspiciousActivity');
const logger = require('../config/logger');

let io;

const initializeSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: [
        process.env.PASSENGER_APP_URL,
        process.env.DRIVER_APP_URL,
        process.env.ADMIN_APP_URL
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.userId}`, { role: socket.userRole });

    socket.join(`user_${socket.userId}`);

    if (socket.userRole === 'driver') {
      socket.join('drivers');
    } else if (socket.userRole === 'passenger') {
      socket.join('passengers');
      socket.emit('join_passengers', { userId: socket.userId });
    } else if (socket.userRole === 'admin') {
      socket.join('admins');
    }

    socket.on('join_trip', (tripId) => {
      socket.join(`trip_${tripId}`);
    });

    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
    });

    socket.on('driver_location_update', async (data) => {
      try {
        const { tripId, coordinates, speed, heading } = data;
        // Driver frontend sends [longitude, latitude] from Geolocation API — already correct for MongoDB

        await User.findByIdAndUpdate(socket.userId, {
          currentLocation: {
            type: 'Point',
            coordinates: coordinates,
            updatedAt: new Date()
          }
        });

        // Speed monitoring alert (exceeds 80 km/h)
        if (speed && speed > 80) {
          io.to('admins').emit('speed_alert', {
            driverId: socket.userId,
            speed,
            coordinates,
            timestamp: new Date()
          });
          const existingSpeed = await SuspiciousActivity.findOne({
            driver: socket.userId,
            type: 'speed_violation',
            status: { $in: ['detected', 'investigating'] },
            detectedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
          });
          if (!existingSpeed) {
            await SuspiciousActivity.create({
              user: socket.userId,
              driver: socket.userId,
              type: 'speed_violation',
              severity: speed > 120 ? 'high' : 'medium',
              description: `Recorded speed: ${speed} km/h (limit: 80 km/h)`,
              location: { type: 'Point', coordinates },
              status: 'detected',
              recordedSpeed: speed,
              speedLimit: 80
            });
          }
        }

        // Geofencing check (Dire Dawa service area bounds)
        const [lon, lat] = coordinates;
        const direDawaBounds = { minLat: 9.55, maxLat: 9.66, minLon: 41.80, maxLon: 41.92 };
        if (lat < direDawaBounds.minLat || lat > direDawaBounds.maxLat || 
            lon < direDawaBounds.minLon || lon > direDawaBounds.maxLon) {
          io.to('admins').emit('geofence_alert', {
            driverId: socket.userId,
            coordinates,
            message: 'Driver left service area',
            timestamp: new Date()
          });
          const existingJump = await SuspiciousActivity.findOne({
            driver: socket.userId,
            type: 'location_jump',
            status: { $in: ['detected', 'investigating'] },
            detectedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
          });
          if (!existingJump) {
            await SuspiciousActivity.create({
              user: socket.userId,
              driver: socket.userId,
              type: 'location_jump',
              severity: 'high',
              description: 'Driver location outside service area bounds',
              location: { type: 'Point', coordinates },
              status: 'detected'
            });
          }
        }

        if (tripId) {
          io.to(`trip_${tripId}`).emit('driver_location', {
            driverId: socket.userId,
            coordinates,
            speed,
            heading,
            timestamp: new Date()
          });
          // Also emit to admins for live tracking
          io.to('admins').emit('driver_location_update', {
            driverId: socket.userId,
            tripId,
            coordinates,
            speed,
            heading,
            timestamp: new Date()
          });
        }
      } catch (error) {
        logger.error('Location update error', { error: error.message, socketId: socket.id });
      }
    });

    socket.on('ride_request', (data) => {
      if (socket.userRole !== 'passenger') {
        return socket.emit('error', { message: 'Unauthorized' });
      }
    });

    socket.on('ride_accepted', (data) => {
      io.to(`user_${data.passengerId}`).emit('ride_accepted', data);
    });

    socket.on('ride_cancelled', (data) => {
      if (data.driverId) {
        io.to(`user_${data.driverId}`).emit('ride_cancelled', data);
      }
      if (data.passengerId) {
        io.to(`user_${data.passengerId}`).emit('ride_cancelled', data);
      }
    });

    socket.on('trip_status_update', (data) => {
      io.to(`trip_${data.tripId}`).emit('trip_status', data);
    });

    socket.on('sos_alert', (data) => {
      io.to('admins').emit('sos_alert', data);
      io.to('drivers').emit('sos_alert', data);
    });

    socket.on('admin_broadcast', (data) => {
      if (socket.userRole !== 'admin') {
        return socket.emit('error', { message: 'Unauthorized' });
      }
      io.to(data.target).emit('broadcast', data);
    });

    socket.on('typing', (data) => {
      io.to(`trip_${data.tripId}`).emit('user_typing', {
        userId: socket.userId,
        isTyping: data.isTyping
      });
    });

    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: ${socket.userId}`);
      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          'currentLocation.updatedAt': new Date()
        });
        if (socket.userRole === 'driver') {
          await Driver.updateOne(
            { user: socket.userId },
            { isOnline: false, isAvailable: false, currentTrip: null }
          );
        }
      } catch (error) {
        logger.error('Disconnect update error', { error: error.message, socketId: socket.id });
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO };
