import { io } from 'socket.io-client';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket = null;

const socketService = {
  connect(token) {
    if (socket?.connected) return socket;

    socket = io(SOCKET_URL, {
      auth:            { token },
      transports:      ['websocket'],
      reconnection:    true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
      timeout:         10000,
    });

    socket.on('connect',          () => console.log('🔌 Socket connected:', socket.id));
    socket.on('disconnect',       (reason) => console.log('🔌 Socket disconnected:', reason));
    socket.on('connect_error',    (err)    => console.error('Socket error:', err.message));
    socket.on('reconnect_attempt',(n)      => console.log(`Socket reconnect attempt ${n}`));

    return socket;
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

  get instance() {
    return socket;
  },
};

export default socketService;
