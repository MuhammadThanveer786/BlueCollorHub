// src/app/dashboard/SocketConnectionClient.jsx (Example File)

import { useEffect } from 'react';
import io from 'socket.io-client';

const CURRENT_USER_ID = 'your_logged_in_user_id';
// NOTE: For Next.js API routes, the client connects to its own base URL.
const SERVER_URL = 'http://localhost:3000'; 

const SocketConnectionClient = () => {
  useEffect(() => {
    // 🚨 CRITICAL FIX: Include the 'path' option here
    const socket = io(SERVER_URL, {
      path: '/api/socket', 
      autoConnect: true,
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully! Registering user...');
      socket.emit('register_user', CURRENT_USER_ID);
    });

    // This listener is crucial for debugging the "xhr poll error"
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      // If you still see "xhr poll error", double-check your SERVER_URL and if the API route is running.
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Add other message listeners here (e.g., 'receive_private_message')

    return () => {
      socket.disconnect();
    };
  }, []);

  return null; // This component handles connection logic, doesn't need UI
};

export default SocketConnectionClient;