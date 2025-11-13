import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_URL, MESSAGE_TYPES, CONNECTION_STATES } from '../config/constants';

let messageIdCounter = 0;
const generateMessageId = () => {
  return `msg-${Date.now()}-${++messageIdCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useMobilePieraServer = (username) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState('');

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const usernameRef = useRef(username);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState(CONNECTION_STATES.CONNECTING);

    try {
      const ws = new WebSocket(WEBSOCKET_URL);

      ws.onopen = () => {
        console.log('📱 Mobile WebSocket connected');
        setConnectionState(CONNECTION_STATES.CONNECTED);
        setError('');
        reconnectAttemptsRef.current = 0;

        if (usernameRef.current) {
          ws.send(JSON.stringify({
            type: MESSAGE_TYPES.JOIN,
            username: usernameRef.current
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(CONNECTION_STATES.ERROR);
        setError('Errore di connessione');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setConnectionState(CONNECTION_STATES.DISCONNECTED);

        if (usernameRef.current) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Connection error:', error);
      setError('Impossibile connettersi al server');
      setConnectionState(CONNECTION_STATES.ERROR);
    }
  }, []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case MESSAGE_TYPES.MESSAGE:
        setMessages(prev => [...prev, {
          id: data.messageId || generateMessageId(),
          type: 'message',
          username: data.username,
          message: data.message || data.encryptedMessage,
          timestamp: data.timestamp || new Date().toISOString(),
          isOwn: data.username === usernameRef.current
        }]);
        break;

      case MESSAGE_TYPES.JOIN:
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'system',
          message: `${data.username} è entrato nella chat`
        }]);
        if (data.users) {
          setOnlineUsers(data.users.map(u => u.username || u));
        }
        break;

      case MESSAGE_TYPES.LEAVE:
        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'system',
          message: `${data.username} ha lasciato la chat`
        }]);
        if (data.users) {
          setOnlineUsers(data.users.map(u => u.username || u));
        }
        break;

      case MESSAGE_TYPES.USERS:
        setOnlineUsers(data.users ? data.users.map(u => u.username || u) : []);
        break;

      case MESSAGE_TYPES.TYPING:
        if (data.username !== usernameRef.current) {
          setTypingUsers(prev => new Set(prev).add(data.username));
        }
        break;

      case MESSAGE_TYPES.STOP_TYPING:
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.username);
          return newSet;
        });
        break;

      case MESSAGE_TYPES.ERROR:
        setError(data.message);
        setTimeout(() => setError(''), 5000);
        break;

      case MESSAGE_TYPES.SYSTEM:
        if (data.message) {
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            type: 'system',
            message: data.message
          }]);
        }
        break;
    }
  }, []);

  const sendMessage = useCallback((message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: MESSAGE_TYPES.MESSAGE,
        message
      }));
    }
  }, []);

  const sendTyping = useCallback((isTyping) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: isTyping ? MESSAGE_TYPES.TYPING : MESSAGE_TYPES.STOP_TYPING
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (username) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return {
    connectionState,
    messages,
    onlineUsers,
    typingUsers,
    error,
    sendMessage,
    sendTyping,
    isConnected: connectionState === CONNECTION_STATES.CONNECTED
  };
};

export default useMobilePieraServer;
