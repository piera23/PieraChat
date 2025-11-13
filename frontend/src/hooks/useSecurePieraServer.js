import { useState, useEffect, useRef, useCallback } from 'react';
import { WEBSOCKET_URL, MESSAGE_TYPES, CONNECTION_STATES } from '../utils/constants';
import { getEncryptionManager, clearEncryptionManager } from '../utils/encryption';

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

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const usernameRef = useRef(username);
  const encryptionManager = useRef(null);

  // Update username ref when it changes
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

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
      console.log('WebSocket connected');
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

          setMessages(prev => [...prev, {
            id: data.messageId || generateMessageId(),
            type: 'message',
            username: data.username,
            message: messageText,
            timestamp: data.timestamp || new Date().toISOString(),
            isOwn: data.username === usernameRef.current,
            encrypted: !!data.encryptedMessage
          }]);
        } catch (error) {
          console.error('Error processing message:', error);
        }
        break;

      case MESSAGE_TYPES.JOIN:
        // Store user's public key
        if (data.publicKey && encryptionManager.current) {
          await encryptionManager.current.storeUserPublicKey(data.username, data.publicKey);
        }

        setMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'system',
          message: `🔐 ${data.username} è entrato nella chat (encrypted)`
        }]);

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
          setMessages(prev => [...prev, {
            id: generateMessageId(),
            type: 'system',
            message: data.message
          }]);
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
    encryptionReady
  };
};

export default useSecurePieraServer;
