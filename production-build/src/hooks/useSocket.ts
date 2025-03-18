// src/hooks/useSocket.ts
import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
}

export const useSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create socket connection
    const socketIo = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');

    // Set up event listeners
    socketIo.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketIo.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // Save socket instance
    setSocket(socketIo);

    // Clean up on unmount
    return () => {
      socketIo.disconnect();
    };
  }, []);

  return { socket, isConnected };
};
