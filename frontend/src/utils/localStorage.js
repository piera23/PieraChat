/**
 * Local Storage Manager using IndexedDB
 * All chat messages are stored locally on user's device
 * Server is NEVER involved in storage - only relays messages
 *
 * Privacy-First: Your data stays on YOUR device!
 */

const DB_NAME = 'PieraChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'messages';
const STORE_USERS = 'users';
const STORE_SETTINGS = 'settings';

class LocalStorageManager {
  constructor() {
    this.db = null;
    this.isReady = false;
  }

  /**
   * Initialize IndexedDB
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isReady = true;
        console.log('📦 Local storage initialized (IndexedDB)');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Messages store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const messagesStore = db.createObjectStore(STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false
          });
          messagesStore.createIndex('username', 'username', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
          messagesStore.createIndex('type', 'type', { unique: false });
        }

        // Users store (for recent contacts)
        if (!db.objectStoreNames.contains(STORE_USERS)) {
          const usersStore = db.createObjectStore(STORE_USERS, {
            keyPath: 'username'
          });
          usersStore.createIndex('lastSeen', 'lastSeen', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS, {
            keyPath: 'key'
          });
        }

        console.log('📦 Database schema created');
      };
    });
  }

  /**
   * Save a message to local storage
   */
  async saveMessage(message) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const messageData = {
        id: message.id,
        type: message.type,
        username: message.username,
        message: message.message,
        timestamp: message.timestamp || new Date().toISOString(),
        isOwn: message.isOwn,
        encrypted: message.encrypted || false
      };

      const request = store.add(messageData);

      request.onsuccess = () => {
        resolve(messageData);
      };

      request.onerror = () => {
        // If duplicate key, update instead
        if (request.error.name === 'ConstraintError') {
          const updateRequest = store.put(messageData);
          updateRequest.onsuccess = () => resolve(messageData);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(request.error);
        }
      };
    });
  }

  /**
   * Save multiple messages (bulk insert)
   */
  async saveMessages(messages) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      let completed = 0;
      const total = messages.length;

      messages.forEach((message) => {
        const request = store.put({
          id: message.id,
          type: message.type,
          username: message.username,
          message: message.message,
          timestamp: message.timestamp || new Date().toISOString(),
          isOwn: message.isOwn,
          encrypted: message.encrypted || false
        });

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve(completed);
          }
        };
      });

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Load all messages from local storage
   */
  async loadMessages(limit = 100) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('timestamp');

      const messages = [];
      const request = index.openCursor(null, 'prev'); // Newest first

      let count = 0;
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          messages.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          // Reverse to get oldest first
          resolve(messages.reverse());
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get messages count
   */
  async getMessageCount() {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all messages (delete history)
   */
  async clearMessages() {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🗑️ Local message history cleared');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export all messages as JSON
   */
  async exportMessages() {
    const messages = await this.loadMessages(Infinity); // Load all
    const exportData = {
      version: '2.0',
      exportDate: new Date().toISOString(),
      messageCount: messages.length,
      messages: messages
    };

    return exportData;
  }

  /**
   * Export messages as downloadable JSON file
   */
  async downloadExport() {
    const data = await this.exportMessages();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pierachat-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Chat history exported');
    return data;
  }

  /**
   * Export messages as text file
   */
  async downloadTextExport() {
    const messages = await this.loadMessages(Infinity);

    let text = '=== PieraChat History Export ===\n';
    text += `Exported: ${new Date().toLocaleString()}\n`;
    text += `Total Messages: ${messages.length}\n`;
    text += '=' .repeat(40) + '\n\n';

    messages.forEach((msg) => {
      if (msg.type === 'system') {
        text += `[SYSTEM] ${msg.message}\n`;
      } else {
        const time = new Date(msg.timestamp).toLocaleString();
        text += `[${time}] ${msg.username}: ${msg.message}\n`;
      }
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pierachat-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('💾 Chat history exported as text');
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
   * Save user info (for recent contacts)
   */
  async saveUser(username) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_USERS], 'readwrite');
      const store = transaction.objectStore(STORE_USERS);

      const userData = {
        username,
        lastSeen: new Date().toISOString()
      };

      const request = store.put(userData);
      request.onsuccess = () => resolve(userData);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save setting
   */
  async saveSetting(key, value) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);

      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get setting
   */
  async getSetting(key, defaultValue = null) {
    if (!this.isReady) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_SETTINGS], 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);

      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage stats
   */
  async getStats() {
    const messageCount = await this.getMessageCount();

    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      return {
        messageCount,
        storageUsed: estimate.usage,
        storageQuota: estimate.quota,
        storageUsedMB: (estimate.usage / (1024 * 1024)).toFixed(2),
        storageQuotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
        usagePercentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }

    return { messageCount };
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.isReady = false;
      console.log('📦 Local storage closed');
    }
  }
}

// Singleton instance
let storageInstance = null;

export const getLocalStorage = () => {
  if (!storageInstance) {
    storageInstance = new LocalStorageManager();
  }
  return storageInstance;
};

export const clearLocalStorage = () => {
  if (storageInstance) {
    storageInstance.close();
  }
  storageInstance = null;
};

export default {
  getLocalStorage,
  clearLocalStorage
};
