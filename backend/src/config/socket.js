const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust this for production
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Allow clients to join specific project rooms for targeted updates
    socket.on('join_project', (projectId) => {
      socket.join(projectId);
      logger.info(`Socket ${socket.id} joined project room: ${projectId}`);
    });

    socket.on('leave_project', (projectId) => {
      socket.leave(projectId);
      logger.info(`Socket ${socket.id} left project room: ${projectId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized!');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};
