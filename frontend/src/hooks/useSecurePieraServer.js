import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_URL, MESSAGE_TYPES, CONNECTION_STATES } from '../utils/constants';
import { getEncryptionManager, clearEncryptionManager } from '../utils/encryption';
import { getLocalStorage } from '../utils/localStorage';

// Utility function to generate unique message IDs
let messageIdCounter = 0;
const generateMessageId = () => {
  return `msg-${Date.now()}-${++messageIdCounter}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useSecurePieraServer = (username) => {
  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.DISCONNECTED);
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [error, setError] = useState('');
  const [encryptionReady, setEncryptionReady] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const usernameRef = useRef(username);
  const encryptionManager = useRef(null);
  const localStorage = useRef(null);

  // Update username ref when it changes
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Initialize local storage and load history
  useEffect(() => {
    const initStorage = async () => {
      try {
        localStorage.current = getLocalStorage();
        await localStorage.current.init();

        // Load message history from local device
        const savedMessages = await localStorage.current.loadMessages();
        if (savedMessages.length > 0) {
          console.log(`📦 Loaded ${savedMessages.length} messages from local storage`);
          setMessages(savedMessages);
          setHistoryLoaded(true);
        }
      } catch (err) {
        console.error('Failed to initialize local storage:', err);
      }
    };

    initStorage();
  }, []);

  // Initialize encryption
  useEffect(() => {
    const initEncryption = async () => {
      try {
        encryptionManager.current = getEncryptionManager();
        await encryptionManager.current.initialize();
        setEncryptionReady(true);
      } catch (err) {
        console.error('Failed to initialize encryption:', err);
        setError('Encryption initialization failed');
      }
    };

    if (username) {
      initEncryption();
    }

    return () => {
      if (!username) {
        clearEncryptionManager();
        setEncryptionReady(false);
      }
    };
  }, [username]);

  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (!encryptionReady) {
      console.log('Waiting for encryption to be ready...');
      return;
    }

    setConnectionState(CONNECTION_STATES.CONNECTING);
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('✅ WebSocket connected - Server is relay only, messages stay on your device!');
      setConnectionState(CONNECTION_STATES.CONNECTED);
      setError('');
      reconnectAttemptsRef.current = 0;

      // Send join message with public key
      if (usernameRef.current && encryptionManager.current) {
        const publicKey = encryptionManager.current.publicKeyExported;
        ws.send(JSON.stringify({
          type: MESSAGE_TYPES.JOIN,
          username: usernameRef.current,
          publicKey
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

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setConnectionState(CONNECTION_STATES.ERROR);
      setError('Errore di connessione');
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnectionState(CONNECTION_STATES.DISCONNECTED);

      // Attempt to reconnect with exponential backoff
      if (usernameRef.current) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        reconnectAttemptsRef.current++;

        reconnectTimeoutRef.current = setTimeout(() => {
          if (encryptionReady) {
            connect();
          }
        }, delay);
      }
    };

    wsRef.current = ws;
  }, [encryptionReady]);

  // Auto-connect when encryption is ready
  useEffect(() => {
    if (username && encryptionReady) {
      connect();
    }
  }, [username, encryptionReady, connect]);

  const handleMessage = useCallback(async (data) => {
    let newMessage = null;

    switch (data.type) {
      case MESSAGE_TYPES.MESSAGE:
        try {
          let messageText = data.message;

          // If message is encrypted, decrypt it
          if (data.encryptedMessage) {
            try {
              const encryptedPackage = JSON.parse(data.encryptedMessage);
              messageText = await encryptionManager.current.decryptMessage(
                encryptedPackage,
                data.username
              );
            } catch (decryptError) {
              console.error('Decryption error:', decryptError);
              messageText = '🔒 [Encrypted message]';
            }
          }

          newMessage = {
            id: data.messageId || generateMessageId(),
            type: 'message',
            username: data.username,
            message: messageText,
            timestamp: data.timestamp || new Date().toISOString(),
            isOwn: data.username === usernameRef.current,
            encrypted: !!data.encryptedMessage
          };

          setMessages(prev => [...prev, newMessage]);

          // Save to local storage
          if (localStorage.current) {
            await localStorage.current.saveMessage(newMessage);
            console.log('💾 Message saved locally on your device');
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
        break;

      case MESSAGE_TYPES.JOIN:
        // Store user's public key
        if (data.publicKey && encryptionManager.current) {
          await encryptionManager.current.storeUserPublicKey(data.username, data.publicKey);
        }

        newMessage = {
          id: generateMessageId(),
          type: 'system',
          message: `🔐 ${data.username} è entrato nella chat (encrypted)`,
          timestamp: data.timestamp || new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);

        // Save system message to local storage
        if (localStorage.current) {
          await localStorage.current.saveMessage(newMessage);
          await localStorage.current.saveUser(data.username);
        }

        if (data.users) {
          // Store all users' public keys
          for (const user of data.users) {
            if (user.publicKey && user.username !== usernameRef.current) {
              await encryptionManager.current.storeUserPublicKey(user.username, user.publicKey);
            }
          }
          setOnlineUsers(data.users.map(u => u.username || u));
        }
        break;

      case MESSAGE_TYPES.LEAVE:
        newMessage = {
          id: generateMessageId(),
          type: 'system',
          message: `${data.username} ha lasciato la chat`,
          timestamp: data.timestamp || new Date().toISOString()
        };

        setMessages(prev => [...prev, newMessage]);

        // Save to local storage
        if (localStorage.current) {
          await localStorage.current.saveMessage(newMessage);
        }

        if (data.users) {
          setOnlineUsers(data.users.map(u => u.username || u));
        }
        break;

      case MESSAGE_TYPES.USERS:
        if (data.users && encryptionManager.current) {
          // Store all users' public keys
          for (const user of data.users) {
            if (user.publicKey && user.username !== usernameRef.current) {
              await encryptionManager.current.storeUserPublicKey(user.username, user.publicKey);
            }
          }
          setOnlineUsers(data.users.map(u => u.username || u));
        } else {
          setOnlineUsers(data.users || []);
        }
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
          newMessage = {
            id: generateMessageId(),
            type: 'system',
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          };

          setMessages(prev => [...prev, newMessage]);

          // Save to local storage
          if (localStorage.current) {
            await localStorage.current.saveMessage(newMessage);
          }
        }
        break;
    }
  }, []);

  const sendMessage = useCallback(async (message) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && encryptionManager.current) {
      try {
        // Encrypt the message
        const encryptedPackage = await encryptionManager.current.encryptMessage(message);

        wsRef.current.send(JSON.stringify({
          type: MESSAGE_TYPES.MESSAGE,
          encryptedMessage: JSON.stringify(encryptedPackage)
        }));

        console.log('📤 Encrypted message sent via server relay');
      } catch (error) {
        console.error('Failed to encrypt and send message:', error);
        setError('Failed to send encrypted message');
      }
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
    clearEncryptionManager();
    setEncryptionReady(false);
  }, []);

  // Clear local history
  const clearHistory = useCallback(async () => {
    if (localStorage.current) {
      await localStorage.current.clearMessages();
      setMessages([]);
      console.log('🗑️ Local history cleared from your device');
    }
  }, []);

  // Export chat
  const exportChat = useCallback(async () => {
    if (localStorage.current) {
      await localStorage.current.downloadExport();
    }
  }, []);

  // Export chat as text
  const exportChatText = useCallback(async () => {
    if (localStorage.current) {
      await localStorage.current.downloadTextExport();
    }
  }, []);

  // Get storage stats
  const getStorageStats = useCallback(async () => {
    if (localStorage.current) {
      return await localStorage.current.getStats();
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    connectionState,
    messages,
    onlineUsers,
    typingUsers,
    error,
    sendMessage,
    sendTyping,
    isConnected: connectionState === CONNECTION_STATES.CONNECTED,
    encryptionReady,
    historyLoaded,
    // Local storage functions
    clearHistory,
    exportChat,
    exportChatText,
    getStorageStats
  };
};

export default useSecurePieraServer;
