export const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080/ws';

export const MESSAGE_TYPES = {
  JOIN: 'join',
  LEAVE: 'leave',
  MESSAGE: 'message',
  TYPING: 'typing',
  STOP_TYPING: 'stopTyping',
  USERS: 'users',
  SYSTEM: 'system',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong'
};

export const CONNECTION_STATES = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error'
};