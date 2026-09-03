import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Determine backend URL (usually window.location.hostname for prod)
    // Here we connect to the known backend port 5555
    const backendUrl = import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('/api/v1', '') 
      : 'http://localhost:5555';

    // Vercel Serverless Functions do not support WebSockets.
    // If the backend URL is on Vercel, we disable Socket.IO to prevent 404 polling spam.
    if (backendUrl.includes('vercel.app')) {
      console.warn('Socket.IO disabled: Vercel does not support WebSockets.');
      setSocket({ on: () => {}, off: () => {}, emit: () => {}, disconnect: () => {}, id: 'disabled' });
      return;
    }

    const newSocket = io(backendUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
