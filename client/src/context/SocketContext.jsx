import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      // Use environment variable for socket URL (supports multi-laptop setup)
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
      
      const newSocket = io(socketUrl, {
        auth: {
          token: localStorage.getItem('token'),
          userId: user.id,
          userName: user.name
        },
        // Add reconnection settings for network reliability
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', () => {
        console.log('✅ Socket connected:', newSocket.id);
        console.log('🔗 Connected to:', socketUrl);
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('⚠️ Socket connection error:', error.message);
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};






