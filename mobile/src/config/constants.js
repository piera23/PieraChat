// WebSocket URL - change this to your server URL
export const WEBSOCKET_URL = 'ws://localhost:8080/ws';
// For testing on physical device, use your computer's local IP:
// export const WEBSOCKET_URL = 'ws://192.168.1.x:8080/ws';

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

export const COLORS = {
  primary: '#7c3aed',
  secondary: '#3b82f6',
  background: '#f3f4f6',
  surface: '#ffffff',
  text: '#1f2937',
  textSecondary: '#6b7280',
  error: '#ef4444',
  success: '#10b981',
  online: '#10b981',
  offline: '#ef4444'
};
