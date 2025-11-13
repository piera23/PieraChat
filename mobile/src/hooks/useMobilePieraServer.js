import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_URL, MESSAGE_TYPES, CONNECTION_STATES } from '../config/constants';
import { getMobileStorage } from '../utils/mobileStorage';

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
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const usernameRef = useRef(username);
  const localStorage = useRef(null);

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Initialize local storage and load message history
  useEffect(() => {
    const initStorage = async () => {
      try {
        localStorage.current = getMobileStorage();
        await localStorage.current.init();
        console.log('📱 Mobile storage initialized');

        // Load message history from device
        const savedMessages = await localStorage.current.loadMessages();
        if (savedMessages.length > 0) {
          console.log(`📦 Loaded ${savedMessages.length} messages from device storage`);
          setMessages(savedMessages);
          setHistoryLoaded(true);
        }
      } catch (error) {
        console.error('Failed to initialize storage:', error);
      }
    };

    initStorage();
  }, []);

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

  const handleMessage = useCallback(async (data) => {
    switch (data.type) {
      case MESSAGE_TYPES.MESSAGE:
        const newMessage = {
          id: data.messageId || generateMessageId(),
          type: 'message',
          username: data.username,
          message: data.message || data.encryptedMessage,
          timestamp: data.timestamp || new Date().toISOString(),
          isOwn: data.username === usernameRef.current
        };

        setMessages(prev => [...prev, newMessage]);

        // Save to local device storage
        if (localStorage.current) {
          try {
            await localStorage.current.saveMessage(newMessage);
            console.log('💾 Message saved locally on your device');
          } catch (error) {
            console.error('Failed to save message:', error);
          }
        }
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

  // Clear local chat history
  const clearHistory = useCallback(async () => {
    if (localStorage.current) {
      try {
        await localStorage.current.clearMessages();
        setMessages([]);
        setHistoryLoaded(false);
        console.log('🗑️ Chat history cleared from device');
      } catch (error) {
        console.error('Failed to clear history:', error);
        throw error;
      }
    }
  }, []);

  // Export chat as JSON file
  const exportChat = useCallback(async () => {
    if (localStorage.current) {
      try {
        const fileUri = await localStorage.current.exportToFile();
        console.log('💾 Chat exported to JSON');
        return fileUri;
      } catch (error) {
        console.error('Failed to export chat:', error);
        throw error;
      }
    }
  }, []);

  // Export chat as text file
  const exportChatText = useCallback(async () => {
    if (localStorage.current) {
      try {
        const fileUri = await localStorage.current.exportToTextFile();
        console.log('💾 Chat exported to TXT');
        return fileUri;
      } catch (error) {
        console.error('Failed to export chat as text:', error);
        throw error;
      }
    }
  }, []);

  // Get storage statistics
  const getStorageStats = useCallback(async () => {
    if (localStorage.current) {
      try {
        return await localStorage.current.getStats();
      } catch (error) {
        console.error('Failed to get storage stats:', error);
        return { messageCount: 0 };
      }
    }
    return { messageCount: 0 };
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
    isConnected: connectionState === CONNECTION_STATES.CONNECTED,
    historyLoaded,
    clearHistory,
    exportChat,
    exportChatText,
    getStorageStats
  };
};

export default useMobilePieraServer;
