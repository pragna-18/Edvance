import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const initializeSocket = (io) => {
  io.use((socket, next) => {
    // Simple authentication - in production, verify JWT token
    const token = socket.handshake.auth.token;
    if (token) {
      // Verify token and attach user to socket
      socket.userId = socket.handshake.auth.userId;
      socket.userName = socket.handshake.auth.userName;
      next();
    } else {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join room for a specific lesson plan
    socket.on('join-plan', async (planId) => {
      socket.join(`plan-${planId}`);
      socket.currentPlan = planId;
      
      // Notify others in the room
      socket.to(`plan-${planId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName
      });

      // Send current users in the room
      const room = io.sockets.adapter.rooms.get(`plan-${planId}`);
      if (room) {
        const users = [];
        for (const socketId of room) {
          const socketInRoom = io.sockets.sockets.get(socketId);
          if (socketInRoom) {
            users.push({
              userId: socketInRoom.userId,
              userName: socketInRoom.userName
            });
          }
        }
        socket.emit('users-in-room', users);
      }
    });

    // Leave room
    socket.on('leave-plan', (planId) => {
      socket.leave(`plan-${planId}`);
      socket.to(`plan-${planId}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName
      });
      socket.currentPlan = null;
    });

    // Handle content changes
    socket.on('content-change', async (data) => {
      if (socket.currentPlan) {
        socket.to(`plan-${socket.currentPlan}`).emit('content-change', {
          ...data,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      }
    });

    // Handle cursor position
    socket.on('cursor-position', (data) => {
      if (socket.currentPlan) {
        socket.to(`plan-${socket.currentPlan}`).emit('cursor-position', {
          ...data,
          userId: socket.userId,
          userName: socket.userName
        });
      }
    });

    // Handle comments
    socket.on('comment', async (data) => {
      if (socket.currentPlan) {
        // Broadcast comment to all users in the room
        io.to(`plan-${socket.currentPlan}`).emit('new-comment', {
          ...data,
          userId: socket.userId,
          userName: socket.userName,
          timestamp: new Date()
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.currentPlan) {
        socket.to(`plan-${socket.currentPlan}`).emit('user-left', {
          userId: socket.userId,
          userName: socket.userName
        });
      }
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};






