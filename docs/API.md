# 📡 API Documentation PieraChat v2.0

**Documentazione completa WebSocket Protocol e HTTP Endpoints**

---

## Indice

- [Overview](#overview)
- [WebSocket Protocol](#websocket-protocol)
  - [Connection](#connection)
  - [Message Types](#message-types)
  - [Encryption](#encryption)
- [HTTP Endpoints](#http-endpoints)
  - [File Upload](#file-upload)
  - [File Download](#file-download)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Overview

PieraChat utilizza:
- **WebSocket** per comunicazione real-time bidirezionale
- **HTTP** per upload/download file multimediali
- **E2EE** (End-to-End Encryption) con RSA-2048 + AES-256-GCM

### Base URLs

**Development:**
- WebSocket: `ws://localhost:8080/ws`
- HTTP: `http://localhost:8080`

**Production:**
- WebSocket: `wss://chat.example.com/ws`
- HTTP: `https://chat.example.com`

---

## WebSocket Protocol

### Connection

**Endpoint:** `/ws`

**Protocols:**
- Development: `ws://`
- Production: `wss://` (WebSocket Secure)

**Connection Lifecycle:**

```javascript
// 1. Connessione
const ws = new WebSocket('wss://chat.example.com/ws');

// 2. Eventi
ws.onopen = () => {
  console.log('Connected');
  // Invia messaggio di join
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
  // Implementa reconnection logic
};

// 3. Invio messaggi
ws.send(JSON.stringify({
  type: 'message',
  username: 'Alice',
  content: 'Hello!'
}));

// 4. Chiusura
ws.close();
```

---

### Message Types

Tutti i messaggi sono in formato JSON.

#### 1. JOIN - Unisciti alla Chat

**Client → Server**

```json
{
  "type": "join",
  "username": "Alice",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG..."
}
```

**Fields:**
- `type` (string, required): "join"
- `username` (string, required): 3-50 caratteri, alfanumerici + underscore
- `publicKey` (string, required): RSA public key in formato PEM

**Server → Client (Success)**

```json
{
  "type": "system",
  "content": "Alice si è unito alla chat"
}
```

**Server → All Clients**

```json
{
  "type": "users",
  "users": [
    {
      "username": "Alice",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
    },
    {
      "username": "Bob",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
    }
  ]
}
```

---

#### 2. MESSAGE - Invio Messaggio Crittografato

**Client → Server**

```json
{
  "type": "message",
  "username": "Alice",
  "encryptedData": {
    "recipient1": {
      "encryptedMessage": "base64_encrypted_message",
      "encryptedKey": "base64_encrypted_aes_key",
      "iv": "base64_initialization_vector"
    },
    "recipient2": {
      "encryptedMessage": "...",
      "encryptedKey": "...",
      "iv": "..."
    }
  },
  "timestamp": 1699564800000
}
```

**Fields:**
- `type` (string, required): "message"
- `username` (string, required): Sender username
- `encryptedData` (object, required): Map di username → encrypted payload
  - `encryptedMessage` (string): AES-GCM encrypted message (base64)
  - `encryptedKey` (string): RSA-OAEP encrypted AES key (base64)
  - `iv` (string): AES initialization vector (base64)
- `timestamp` (number, optional): Unix timestamp milliseconds

**Server → Recipients**

Il server inoltra il messaggio a tutti i destinatari senza modifiche:

```json
{
  "type": "message",
  "username": "Alice",
  "encryptedData": {
    "Bob": {
      "encryptedMessage": "...",
      "encryptedKey": "...",
      "iv": "..."
    }
  },
  "timestamp": 1699564800000
}
```

---

#### 3. MULTIMEDIA MESSAGE - Messaggio con Media

**Client → Server**

Per file piccoli (<1MB) - inline base64:

```json
{
  "type": "message",
  "username": "Alice",
  "encryptedData": {
    "Bob": {
      "encryptedMessage": "base64_encrypted_payload",
      "encryptedKey": "...",
      "iv": "..."
    }
  },
  "timestamp": 1699564800000
}
```

**Decrypted Payload Structure:**

```json
{
  "text": "Guarda questa foto!",
  "media": {
    "type": "image",
    "fileName": "photo.jpg",
    "fileSize": 524288,
    "mimeType": "image/jpeg",
    "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "width": 1920,
    "height": 1080,
    "downloaded": true
  }
}
```

Per file grandi (>1MB) - reference to server:

```json
{
  "text": "Video di 50MB",
  "media": {
    "type": "video",
    "fileName": "video.mp4",
    "fileSize": 52428800,
    "mimeType": "video/mp4",
    "fileId": "f7d3c2e1-a4b5-4c6d-8e9f-0a1b2c3d4e5f",
    "downloadUrl": "https://chat.example.com/api/download/f7d3c2e1...",
    "expiresAt": "2024-11-14T12:00:00Z",
    "duration": 120,
    "width": 1920,
    "height": 1080,
    "downloaded": false
  }
}
```

**Media Types:**
- `image` - Immagini (JPEG, PNG, GIF)
- `video` - Video (MP4, WebM)
- `audio` - Audio/Voce (WebM, MP3, OGG)
- `file` - File generici (PDF, DOCX, etc.)

**Contact Message:**

```json
{
  "text": "Contatto",
  "contact": {
    "name": "John Doe",
    "phoneNumbers": ["+39 123 456 7890"],
    "emails": ["john@example.com"]
  }
}
```

**Event Message:**

```json
{
  "text": "Evento",
  "event": {
    "title": "Riunione",
    "description": "Riunione settimanale",
    "location": "Sala conferenze",
    "startDate": "2024-11-15T10:00:00Z",
    "endDate": "2024-11-15T11:00:00Z",
    "allDay": false
  }
}
```

---

#### 4. TYPING - Indicatore Digitazione

**Client → Server**

```json
{
  "type": "typing",
  "username": "Alice"
}
```

**Server → All Clients**

```json
{
  "type": "typing",
  "username": "Alice"
}
```

---

#### 5. STOP_TYPING - Stop Indicatore

**Client → Server**

```json
{
  "type": "stopTyping",
  "username": "Alice"
}
```

**Server → All Clients**

```json
{
  "type": "stopTyping",
  "username": "Alice"
}
```

---

#### 6. LEAVE - Abbandona Chat

**Client → Server**

```json
{
  "type": "leave",
  "username": "Alice"
}
```

**Server → All Clients**

```json
{
  "type": "system",
  "content": "Alice ha abbandonato la chat"
}
```

---

#### 7. USERS - Lista Utenti Online

**Server → Client** (inviato automaticamente a nuovi utenti e quando cambiano gli utenti)

```json
{
  "type": "users",
  "users": [
    {
      "username": "Alice",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
    },
    {
      "username": "Bob",
      "publicKey": "-----BEGIN PUBLIC KEY-----\n..."
    }
  ]
}
```

---

#### 8. SYSTEM - Messaggi di Sistema

**Server → Client**

```json
{
  "type": "system",
  "content": "Alice si è unito alla chat"
}
```

**Possibili messaggi:**
- "Username si è unito alla chat"
- "Username ha abbandonato la chat"
- "Connection established"

---

#### 9. ERROR - Errore

**Server → Client**

```json
{
  "type": "error",
  "error": "Username already taken",
  "code": "USERNAME_TAKEN"
}
```

**Error Codes:**
- `USERNAME_TAKEN` - Username già in uso
- `INVALID_USERNAME` - Username non valido (troppo corto/lungo, caratteri non consentiti)
- `INVALID_MESSAGE` - Formato messaggio non valido
- `MESSAGE_TOO_LARGE` - Messaggio troppo grande (>10KB)
- `RATE_LIMIT_EXCEEDED` - Troppi messaggi in poco tempo
- `UNAUTHORIZED` - Non autorizzato (non hai fatto join)

---

#### 10. PING/PONG - Keep-Alive

**Client → Server**

```json
{
  "type": "ping"
}
```

**Server → Client**

```json
{
  "type": "pong"
}
```

**Utilizzo:**
```javascript
// Invia ping ogni 30 secondi per mantenere connessione
setInterval(() => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ping' }));
  }
}, 30000);
```

---

## HTTP Endpoints

### File Upload

**Endpoint:** `POST /api/upload`

**Description:** Upload di file multimediali (immagini, video, audio, documenti)

**Headers:**
```http
Content-Type: multipart/form-data
```

**Body (multipart/form-data):**
```
file: <binary file data>
username: Alice
```

**Request Example (JavaScript):**

```javascript
const formData = new FormData();
formData.append('file', fileBlob, 'photo.jpg');
formData.append('username', 'Alice');

const response = await fetch('https://chat.example.com/api/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
```

**Response (Success - 200 OK):**

```json
{
  "fileId": "f7d3c2e1-a4b5-4c6d-8e9f-0a1b2c3d4e5f",
  "fileName": "photo.jpg",
  "fileSize": 524288,
  "mimeType": "image/jpeg",
  "downloadUrl": "/api/download/f7d3c2e1-a4b5-4c6d-8e9f-0a1b2c3d4e5f",
  "expiresAt": "2024-11-14T12:00:00Z"
}
```

**Response (Error - 400 Bad Request):**

```json
{
  "error": "File troppo grande (max 100MB)"
}
```

**Validation:**
- **Max file size**: 100MB
- **Total storage per user**: 1GB
- **Allowed MIME types**: Tutti (nessuna restrizione)
- **File expiration**: 24 ore

**Error Codes:**
- `400` - File troppo grande, parametri mancanti
- `403` - Storage limit raggiunto
- `413` - Payload too large
- `500` - Server error

---

### File Download

**Endpoint:** `GET /api/download/{fileId}`

**Description:** Download di file precedentemente caricati

**Parameters:**
- `fileId` (string, required): ID file restituito da /upload

**Headers:**
```http
Accept: */*
```

**Request Example:**

```http
GET /api/download/f7d3c2e1-a4b5-4c6d-8e9f-0a1b2c3d4e5f HTTP/1.1
Host: chat.example.com
```

**Response (Success - 200 OK):**

```http
HTTP/1.1 200 OK
Content-Type: image/jpeg
Content-Length: 524288
Content-Disposition: attachment; filename="photo.jpg"
Cache-Control: private, max-age=3600

<binary file data>
```

**Response (Error - 404 Not Found):**

```json
{
  "error": "File non trovato o scaduto"
}
```

**JavaScript Example:**

```javascript
// Download file
const response = await fetch(`https://chat.example.com/api/download/${fileId}`);
const blob = await response.blob();
const url = URL.createObjectURL(blob);

// Display image
const img = document.createElement('img');
img.src = url;
document.body.appendChild(img);

// Download file
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
```

**React Native Example:**

```javascript
import * as FileSystem from 'expo-file-system';

// Download file
const downloadUrl = `${SERVER_URL}/api/download/${fileId}`;
const localUri = FileSystem.documentDirectory + fileName;

const { uri } = await FileSystem.downloadAsync(downloadUrl, localUri);
console.log('Downloaded to:', uri);
```

---

## Encryption

### End-to-End Encryption Flow

**1. Key Generation (Client-Side)**

```javascript
// Generate RSA-2048 key pair
const keyPair = await window.crypto.subtle.generateKey(
  {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256"
  },
  true,
  ["encrypt", "decrypt"]
);

// Export public key to PEM
const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
const publicKeyPem = jwkToPem(publicKeyJwk);

// Send public key to server
ws.send(JSON.stringify({
  type: 'join',
  username: 'Alice',
  publicKey: publicKeyPem
}));
```

**2. Message Encryption (Client-Side)**

```javascript
// 1. Generate random AES-256 key for this message
const aesKey = await window.crypto.subtle.generateKey(
  { name: "AES-GCM", length: 256 },
  true,
  ["encrypt", "decrypt"]
);

// 2. Generate random IV
const iv = window.crypto.getRandomValues(new Uint8Array(12));

// 3. Encrypt message with AES-GCM
const messageData = new TextEncoder().encode(JSON.stringify({
  text: "Hello!",
  timestamp: Date.now()
}));

const encryptedMessage = await window.crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  aesKey,
  messageData
);

// 4. Encrypt AES key with recipient's RSA public key
const recipientPublicKey = await importRsaKey(recipientPublicKeyPem);
const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey);

const encryptedKey = await window.crypto.subtle.encrypt(
  { name: "RSA-OAEP" },
  recipientPublicKey,
  exportedAesKey
);

// 5. Send encrypted package
ws.send(JSON.stringify({
  type: 'message',
  username: 'Alice',
  encryptedData: {
    'Bob': {
      encryptedMessage: arrayBufferToBase64(encryptedMessage),
      encryptedKey: arrayBufferToBase64(encryptedKey),
      iv: arrayBufferToBase64(iv)
    }
  }
}));
```

**3. Message Decryption (Client-Side)**

```javascript
// 1. Receive encrypted message
ws.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'message') {
    const myEncryptedData = data.encryptedData[myUsername];

    // 2. Decrypt AES key with my RSA private key
    const encryptedKeyBuffer = base64ToArrayBuffer(myEncryptedData.encryptedKey);
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      myPrivateKey,
      encryptedKeyBuffer
    );

    // 3. Import AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // 4. Decrypt message with AES key
    const encryptedMessageBuffer = base64ToArrayBuffer(myEncryptedData.encryptedMessage);
    const ivBuffer = base64ToArrayBuffer(myEncryptedData.iv);

    const decryptedMessage = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBuffer },
      aesKey,
      encryptedMessageBuffer
    );

    // 5. Parse decrypted message
    const messageText = new TextDecoder().decode(decryptedMessage);
    const message = JSON.parse(messageText);

    console.log('Decrypted:', message.text);
  }
};
```

---

## Error Handling

### WebSocket Errors

**Connection Failed:**
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Implement reconnection with exponential backoff
};
```

**Reconnection Strategy:**

```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;
const baseDelay = 1000; // 1 second

function connect() {
  const ws = new WebSocket('wss://chat.example.com/ws');

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      const delay = Math.min(30000, baseDelay * Math.pow(2, reconnectAttempts));
      console.log(`Reconnecting in ${delay}ms...`);

      setTimeout(() => {
        reconnectAttempts++;
        connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0;
    console.log('Connected');
  };
}
```

### HTTP Errors

**Upload Error Handling:**

```javascript
async function uploadFile(file, username) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error.message);
    throw error;
  }
}
```

---

## Rate Limiting

### Limits

- **WebSocket connections**: 10 connections/minute per IP
- **Messages**: No hard limit (spam detection)
- **File uploads**: 10 uploads/minute per user
- **Total storage**: 1GB per user

### Rate Limit Response

**HTTP 429 Too Many Requests:**

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**WebSocket Error:**

```json
{
  "type": "error",
  "error": "Rate limit exceeded, please slow down",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Examples

### Complete Chat Client Example

```javascript
class PieraChatClient {
  constructor(serverUrl, username) {
    this.serverUrl = serverUrl;
    this.username = username;
    this.ws = null;
    this.keyPair = null;
    this.users = new Map();
  }

  async connect() {
    // Generate key pair
    this.keyPair = await this.generateKeyPair();
    const publicKeyPem = await this.exportPublicKey(this.keyPair.publicKey);

    // Connect WebSocket
    this.ws = new WebSocket(this.serverUrl);

    this.ws.onopen = () => {
      console.log('Connected');

      // Send join message
      this.ws.send(JSON.stringify({
        type: 'join',
        username: this.username,
        publicKey: publicKeyPem
      }));
    };

    this.ws.onmessage = (event) => this.handleMessage(event);
    this.ws.onerror = (error) => console.error('WebSocket error:', error);
    this.ws.onclose = () => console.log('Disconnected');
  }

  async handleMessage(event) {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'users':
        // Update users list
        data.users.forEach(user => {
          this.users.set(user.username, user.publicKey);
        });
        console.log('Users online:', Array.from(this.users.keys()));
        break;

      case 'message':
        // Decrypt and display message
        const decrypted = await this.decryptMessage(data);
        console.log(`${data.username}: ${decrypted.text}`);
        break;

      case 'typing':
        console.log(`${data.username} is typing...`);
        break;

      case 'system':
        console.log(`[System] ${data.content}`);
        break;

      case 'error':
        console.error(`[Error] ${data.error}`);
        break;
    }
  }

  async sendMessage(text) {
    // Encrypt message for all recipients
    const encryptedData = {};

    for (const [username, publicKeyPem] of this.users) {
      if (username === this.username) continue; // Skip self

      const encrypted = await this.encryptMessage(text, publicKeyPem);
      encryptedData[username] = encrypted;
    }

    // Send encrypted message
    this.ws.send(JSON.stringify({
      type: 'message',
      username: this.username,
      encryptedData: encryptedData,
      timestamp: Date.now()
    }));
  }

  async generateKeyPair() {
    return await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async exportPublicKey(publicKey) {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exported)));
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;
  }

  async encryptMessage(text, recipientPublicKeyPem) {
    // Implementation details...
    // See "Message Encryption" section above
  }

  async decryptMessage(data) {
    // Implementation details...
    // See "Message Decryption" section above
  }
}

// Usage
const client = new PieraChatClient('wss://chat.example.com/ws', 'Alice');
await client.connect();

// Send message
await client.sendMessage('Hello everyone!');
```

---

## Security Considerations

### Transport Security

- **Always use WSS (WebSocket Secure) in production**
- **Enforce HTTPS for HTTP endpoints**
- **Use valid SSL certificates (Let's Encrypt)**

### Message Security

- **Never send plaintext messages**
- **Validate all inputs server-side**
- **Implement rate limiting**
- **Sanitize user inputs**

### Key Management

- **Never send private keys to server**
- **Store private keys securely (Web Crypto API, Expo SecureStore)**
- **Generate new session keys for each message (Perfect Forward Secrecy)**

---

## Changelog

### v2.0.0 (2024-11-13)
- Added multimedia support (images, video, audio, files)
- Added contact and event sharing
- Added file upload/download HTTP endpoints
- Improved error handling

### v1.0.0 (2024-11-01)
- Initial WebSocket protocol
- End-to-end encryption
- Basic text messaging

---

## Support

- 📖 **Full Documentation**: [docs/](../docs/)
- 🐛 **Report Issues**: https://github.com/piera23/PieraChat/issues
- 💬 **Community**: [Discord](https://discord.gg/pierachat)

---

Made with ❤️ by PieraChat Team
