/**
 * Mobile Local Storage Manager using AsyncStorage
 * All chat messages are stored locally on user's device
 * Server is NEVER involved in storage - only relays messages
 *
 * Privacy-First: Your data stays on YOUR mobile device!
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const MESSAGES_KEY = '@PieraChat:messages';
const USERS_KEY = '@PieraChat:users';
const SETTINGS_KEY = '@PieraChat:settings';

class MobileStorageManager {
  constructor() {
    this.isReady = false;
  }

  /**
   * Initialize storage (no-op for AsyncStorage, always ready)
   */
  async init() {
    this.isReady = true;
    console.log('📱 Mobile local storage initialized');
    return true;
  }

  /**
   * Save a message to local storage
   */
  async saveMessage(message) {
    try {
      const messages = await this.loadMessages();

      const messageData = {
        id: message.id,
        type: message.type,
        username: message.username,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
        isOwn: message.isOwn,
        encrypted: message.encrypted || false
      };

      // Check if message already exists
      const existingIndex = messages.findIndex(m => m.id === message.id);
      if (existingIndex >= 0) {
        messages[existingIndex] = messageData;
      } else {
        messages.push(messageData);
      }

      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      return messageData;
    } catch (error) {
      console.error('Failed to save message:', error);
      throw error;
    }
  }

  /**
   * Save multiple messages (bulk insert)
   */
  async saveMessages(newMessages) {
    try {
      const messages = await this.loadMessages();

      newMessages.forEach(message => {
        const messageData = {
          id: message.id,
          type: message.type,
          username: message.username,
          message: message.message,
          timestamp: message.timestamp || new Date().toISOString(),
          isOwn: message.isOwn,
          encrypted: message.encrypted || false
        };

        const existingIndex = messages.findIndex(m => m.id === message.id);
        if (existingIndex >= 0) {
          messages[existingIndex] = messageData;
        } else {
          messages.push(messageData);
        }
      });

      await AsyncStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      return newMessages.length;
    } catch (error) {
      console.error('Failed to save messages:', error);
      throw error;
    }
  }

  /**
   * Load all messages from local storage
   */
  async loadMessages(limit = 1000) {
    try {
      const data = await AsyncStorage.getItem(MESSAGES_KEY);
      if (!data) return [];

      const messages = JSON.parse(data);

      // Sort by timestamp
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

      // Apply limit
      if (messages.length > limit) {
        return messages.slice(-limit);
      }

      return messages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      return [];
    }
  }

  /**
   * Get messages count
   */
  async getMessageCount() {
    try {
      const messages = await this.loadMessages(Infinity);
      return messages.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Clear all messages (delete history)
   */
  async clearMessages() {
    try {
      await AsyncStorage.removeItem(MESSAGES_KEY);
      console.log('🗑️ Mobile local message history cleared');
    } catch (error) {
      console.error('Failed to clear messages:', error);
      throw error;
    }
  }

  /**
   * Export all messages as JSON
   */
  async exportMessages() {
    const messages = await this.loadMessages(Infinity);
    const exportData = {
      version: '2.0',
      platform: 'mobile',
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };

    return exportData;
  }

  /**
   * Export messages as JSON file
   */
  async exportToFile() {
    try {
      const data = await this.exportMessages();
      const filename = `pierachat-export-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Esporta Cronologia PieraChat',
          UTI: 'public.json'
        });
      }

      console.log('💾 Chat history exported');
      return fileUri;
    } catch (error) {
      console.error('Failed to export:', error);
      throw error;
    }
  }

  /**
   * Export messages as text file
   */
  async exportToTextFile() {
    try {
      const messages = await this.loadMessages(Infinity);

      let text = '=== PieraChat History Export ===\n';
      text += `Exported: ${new Date().toLocaleString()}\n`;
      text += `Total Messages: ${messages.length}\n`;
      text += '='.repeat(40) + '\n\n';

      messages.forEach((msg) => {
        if (msg.type === 'system') {
          text += `[SYSTEM] ${msg.message}\n`;
        } else {
          const time = new Date(msg.timestamp).toLocaleString();
          text += `[${time}] ${msg.username}: ${msg.message}\n`;
        }
      });

      const filename = `pierachat-${Date.now()}.txt`;
      const fileUri = FileSystem.documentDirectory + filename;

      await FileSystem.writeAsStringAsync(fileUri, text, {
        encoding: FileSystem.EncodingType.UTF8
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/plain',
          dialogTitle: 'Esporta Cronologia PieraChat'
        });
      }

      console.log('💾 Chat history exported as text');
      return fileUri;
    } catch (error) {
      console.error('Failed to export text:', error);
      throw error;
    }
  }

  /**
   * Import messages from JSON
   */
  async importMessages(jsonData) {
    if (typeof jsonData === 'string') {
      jsonData = JSON.parse(jsonData);
    }

    if (!jsonData.messages || !Array.isArray(jsonData.messages)) {
      throw new Error('Invalid import format');
    }

    const count = await this.saveMessages(jsonData.messages);
    console.log(`📥 Imported ${count} messages`);
    return count;
  }

  /**
   * Save user info
   */
  async saveUser(username) {
    try {
      const users = await this.getUsers();

      users[username] = {
        username,
        lastSeen: new Date().toISOString()
      };

      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  }

  /**
   * Get users
   */
  async getUsers() {
    try {
      const data = await AsyncStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save setting:', error);
    }
  }

  /**
   * Get setting
   */
  async getSetting(key, defaultValue = null) {
    try {
      const settings = await this.getSettings();
      return settings[key] !== undefined ? settings[key] : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  /**
   * Get all settings
   */
  async getSettings() {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Get storage stats
   */
  async getStats() {
    try {
      const messageCount = await this.getMessageCount();

      // Get approximate storage size
      const messages = await AsyncStorage.getItem(MESSAGES_KEY);
      const users = await AsyncStorage.getItem(USERS_KEY);
      const settings = await AsyncStorage.getItem(SETTINGS_KEY);

      const storageSize =
        (messages?.length || 0) +
        (users?.length || 0) +
        (settings?.length || 0);

      return {
        messageCount,
        storageUsedBytes: storageSize,
        storageUsedKB: (storageSize / 1024).toFixed(2),
        storageUsedMB: (storageSize / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      return { messageCount: 0 };
    }
  }

  /**
   * Clear all data (complete reset)
   */
  async clearAll() {
    try {
      await AsyncStorage.multiRemove([MESSAGES_KEY, USERS_KEY, SETTINGS_KEY]);
      console.log('🗑️ All mobile storage cleared');
    } catch (error) {
      console.error('Failed to clear all:', error);
      throw error;
    }
  }
}

// Singleton instance
let storageInstance = null;

export const getMobileStorage = () => {
  if (!storageInstance) {
    storageInstance = new MobileStorageManager();
  }
  return storageInstance;
};

export const clearMobileStorage = () => {
  storageInstance = null;
};

export default {
  getMobileStorage,
  clearMobileStorage
};
