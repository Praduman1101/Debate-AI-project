import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

const socketService = {
  connect(token) {
    if (socket?.connected) return Promise.resolve(socket);

    return new Promise((resolve, reject) => {
      socket = io(SOCKET_URL, {
        auth:                 { token },
        transports:           ['websocket', 'polling'],
        reconnection:         true,
        reconnectionAttempts: 10,
        reconnectionDelay:    1000,
        timeout:              20000,
      });

      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket.id);
        resolve(socket);
      });

      socket.on('connect_error', (err) => {
        console.error('❌ Socket error:', err.message);
        reject(err);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
      });
    });
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  emit(event, data) {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn(`Socket not connected — cannot emit "${event}"`);
    }
  },

  on(event, callback) {
    if (socket) socket.on(event, callback);
  },

  off(event, callback) {
    if (socket) socket.off(event, callback);
  },

  get isConnected() {
    return socket?.connected ?? false;
  },
};

export default socketService;