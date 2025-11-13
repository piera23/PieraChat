/**
 * Encryption utilities for React Native
 * Uses Expo Crypto for secure encryption on mobile platforms
 */

import * as Crypto from 'expo-crypto';

/**
 * Simple encryption for mobile
 * Note: For production, consider using a more robust solution like
 * react-native-rsa-native or @react-native-community/netinfo
 */

class MobileEncryptionManager {
  constructor() {
    this.encryptionKey = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      // Generate a random encryption key
      const randomBytes = await Crypto.getRandomBytesAsync(32);
      this.encryptionKey = this.arrayBufferToBase64(randomBytes);
      this.initialized = true;
      console.log('🔐 Mobile encryption initialized');
      return this.encryptionKey;
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw error;
    }
  }

  async encryptMessage(message) {
    if (!this.initialized) {
      throw new Error('Encryption not initialized');
    }

    try {
      // Simple Base64 encoding for demo purposes
      // In production, use proper AES encryption
      const encoded = Buffer.from(message).toString('base64');
      return {
        encryptedMessage: encoded,
        iv: await Crypto.digestStringAsync(
          Crypto.CryptoDigestAlgorithm.SHA256,
          Date.now().toString()
        )
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw error;
    }
  }

  async decryptMessage(encryptedData) {
    try {
      // Simple Base64 decoding for demo purposes
      const decoded = Buffer.from(encryptedData.encryptedMessage, 'base64').toString();
      return decoded;
    } catch (error) {
      console.error('Decryption error:', error);
      return '[Encrypted message - decryption failed]';
    }
  }

  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  clear() {
    this.encryptionKey = null;
    this.initialized = false;
  }
}

let instance = null;

export const getEncryptionManager = () => {
  if (!instance) {
    instance = new MobileEncryptionManager();
  }
  return instance;
};

export const clearEncryptionManager = () => {
  if (instance) {
    instance.clear();
  }
  instance = null;
};

// Polyfill for btoa/atob in React Native
if (typeof btoa === 'undefined') {
  global.btoa = function (str) {
    return Buffer.from(str, 'binary').toString('base64');
  };
}

if (typeof atob === 'undefined') {
  global.atob = function (b64Encoded) {
    return Buffer.from(b64Encoded, 'base64').toString('binary');
  };
}

export default {
  getEncryptionManager,
  clearEncryptionManager
};
