/**
 * End-to-End Encryption Module for PieraChat
 * Uses Web Crypto API for secure encryption
 *
 * Encryption Flow:
 * 1. Generate RSA key pair for each user (public/private keys)
 * 2. Exchange public keys via server
 * 3. Generate AES session key for each message
 * 4. Encrypt message with AES
 * 5. Encrypt AES key with recipient's RSA public key
 * 6. Send encrypted message + encrypted key
 */

const ENCRYPTION_CONFIG = {
  RSA: {
    name: 'RSA-OAEP',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256'
  },
  AES: {
    name: 'AES-GCM',
    length: 256
  }
};

class EncryptionManager {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
    this.publicKeyExported = null;
    this.userPublicKeys = new Map(); // username -> public key
  }

  /**
   * Initialize encryption by generating RSA key pair
   */
  async initialize() {
    try {
      const keyPair = await window.crypto.subtle.generateKey(
        ENCRYPTION_CONFIG.RSA,
        true,
        ['encrypt', 'decrypt']
      );

      this.privateKey = keyPair.privateKey;
      this.publicKey = keyPair.publicKey;

      // Export public key to send to server
      const exported = await window.crypto.subtle.exportKey('spki', this.publicKey);
      this.publicKeyExported = this.arrayBufferToBase64(exported);

      console.log('🔐 Encryption initialized successfully');
      return this.publicKeyExported;
    } catch (error) {
      console.error('❌ Encryption initialization failed:', error);
      throw new Error('Failed to initialize encryption');
    }
  }

  /**
   * Store another user's public key
   */
  async storeUserPublicKey(username, publicKeyBase64) {
    if (!publicKeyBase64) return;

    try {
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKeyBase64);
      const publicKey = await window.crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        ENCRYPTION_CONFIG.RSA,
        true,
        ['encrypt']
      );

      this.userPublicKeys.set(username, publicKey);
      console.log(`🔑 Stored public key for ${username}`);
    } catch (error) {
      console.error(`Failed to store public key for ${username}:`, error);
    }
  }

  /**
   * Encrypt a message for all users
   */
  async encryptMessage(message) {
    if (!this.privateKey || !this.publicKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Generate AES session key for this message
      const aesKey = await window.crypto.subtle.generateKey(
        ENCRYPTION_CONFIG.AES,
        true,
        ['encrypt', 'decrypt']
      );

      // Generate IV (Initialization Vector)
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // Encrypt message with AES
      const encodedMessage = new TextEncoder().encode(message);
      const encryptedMessage = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        aesKey,
        encodedMessage
      );

      // Export AES key to encrypt it for each recipient
      const exportedAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

      // Encrypt AES key with each user's public key
      const encryptedKeys = {};
      for (const [username, publicKey] of this.userPublicKeys.entries()) {
        try {
          const encryptedKey = await window.crypto.subtle.encrypt(
            {
              name: 'RSA-OAEP'
            },
            publicKey,
            exportedAesKey
          );
          encryptedKeys[username] = this.arrayBufferToBase64(encryptedKey);
        } catch (error) {
          console.error(`Failed to encrypt key for ${username}:`, error);
        }
      }

      // Also encrypt for ourselves
      if (this.publicKey) {
        const encryptedKey = await window.crypto.subtle.encrypt(
          {
            name: 'RSA-OAEP'
          },
          this.publicKey,
          exportedAesKey
        );
        encryptedKeys['self'] = this.arrayBufferToBase64(encryptedKey);
      }

      // Return encrypted package
      return {
        encryptedMessage: this.arrayBufferToBase64(encryptedMessage),
        iv: this.arrayBufferToBase64(iv),
        encryptedKeys
      };
    } catch (error) {
      console.error('Message encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt a received message
   */
  async decryptMessage(encryptedPackage, senderUsername) {
    if (!this.privateKey) {
      throw new Error('Encryption not initialized');
    }

    try {
      const { encryptedMessage, iv, encryptedKeys } = encryptedPackage;

      // Get the encrypted AES key for us (or 'self' if it's our own message)
      const encryptedKeyBase64 = encryptedKeys['self'] || encryptedKeys[senderUsername];

      if (!encryptedKeyBase64) {
        throw new Error('No encrypted key found for this user');
      }

      // Decrypt AES key with our private RSA key
      const encryptedKeyBuffer = this.base64ToArrayBuffer(encryptedKeyBase64);
      const aesKeyBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP'
        },
        this.privateKey,
        encryptedKeyBuffer
      );

      // Import decrypted AES key
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        aesKeyBuffer,
        ENCRYPTION_CONFIG.AES,
        false,
        ['decrypt']
      );

      // Decrypt message with AES key
      const encryptedMessageBuffer = this.base64ToArrayBuffer(encryptedMessage);
      const ivBuffer = this.base64ToArrayBuffer(iv);

      const decryptedMessage = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivBuffer
        },
        aesKey,
        encryptedMessageBuffer
      );

      // Decode decrypted message
      return new TextDecoder().decode(decryptedMessage);
    } catch (error) {
      console.error('Message decryption failed:', error);
      return '[Encrypted message - decryption failed]';
    }
  }

  /**
   * Check if encryption is available in this environment
   */
  static isSupported() {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Utility: Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Clear all encryption data (logout)
   */
  clear() {
    this.privateKey = null;
    this.publicKey = null;
    this.publicKeyExported = null;
    this.userPublicKeys.clear();
    console.log('🔓 Encryption data cleared');
  }
}

// Singleton instance
let encryptionManagerInstance = null;

export const getEncryptionManager = () => {
  if (!encryptionManagerInstance) {
    encryptionManagerInstance = new EncryptionManager();
  }
  return encryptionManagerInstance;
};

export const clearEncryptionManager = () => {
  if (encryptionManagerInstance) {
    encryptionManagerInstance.clear();
  }
  encryptionManagerInstance = null;
};

export default {
  getEncryptionManager,
  clearEncryptionManager,
  isSupported: EncryptionManager.isSupported
};
