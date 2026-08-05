const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

        await User.findByIdAndUpdate(socket.userId, {
          currentLocation: {
            type: 'Point',
            coordinates: coordinates,
            updatedAt: new Date()
          }
        });

        if (tripId) {
          io.to(`trip_${tripId}`).emit('driver_location', {
            driverId: socket.userId,
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
      io.to('drivers').emit('new_ride_request', data);
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
