# 📸 Sistema Multimedia PieraChat v2.1

## Panoramica

PieraChat v2.1 estende il sistema di messaggistica per supportare condivisione di:

- 📸 **Foto** - Immagini JPG, PNG, GIF, WebP
- 🎥 **Video** - MP4, WebM, MOV
- 🎤 **Messaggi Vocali** - Registrazione e riproduzione audio
- 📎 **File** - PDF, documenti, ZIP, qualsiasi tipo
- 👤 **Contatti** - vCard dalla rubrica
- 📅 **Eventi Calendario** - iCal events
- 📍 **Posizione** - Geolocalizzazione (futuro)
- 🎨 **Sticker/GIF** - Emoji animate (futuro)

## Architettura Ibrida

### Principio Privacy-First Mantenuto

```
┌─────────────────────────────────────────────────────────┐
│           HYBRID MULTIMEDIA ARCHITECTURE                 │
└─────────────────────────────────────────────────────────┘

File Piccoli (<1MB):
┌──────────┐                              ┌──────────┐
│ Client A │──── Base64 crittografato ───>│ Client B │
│          │      (inline in messaggio)   │          │
└──────────┘                              └──────────┘
           NO SERVER STORAGE ✅

File Grandi (>1MB):
┌──────────┐         ┌──────────┐         ┌──────────┐
│ Client A │──Upload─>│  Server  │──Download─>│ Client B │
│          │         │ Temp 24h │         │          │
└──────────┘         └─────┬────┘         └──────────┘
                           │
                      Auto-delete
                      dopo 24h ✅

Storage Locale:
┌──────────────┐
│   Device     │
│ ┌──────────┐ │
│ │   File   │ │ ← Salvato localmente
│ │  Cache   │ │   dopo download
│ └──────────┘ │
└──────────────┘
```

### Tipi di Messaggio

```javascript
Message Types:
{
  text:     'text',      // Messaggio testo normale
  image:    'image',     // Foto/immagine
  video:    'video',     // Video
  audio:    'audio',     // Messaggio vocale
  file:     'file',      // File generico
  contact:  'contact',   // vCard contatto
  event:    'event',     // Evento calendario
  location: 'location',  // Posizione GPS (futuro)
  sticker:  'sticker'    // Sticker/GIF (futuro)
}
```

## Schema Database

### Messages Storage (IndexedDB / AsyncStorage)

```javascript
Message {
  id: string,              // msg-timestamp-counter-random
  type: MessageType,       // 'text' | 'image' | 'video' | ...
  username: string,
  timestamp: ISO8601,
  isOwn: boolean,
  encrypted: boolean,

  // Text message
  message?: string,

  // Media message
  media?: {
    type: MediaType,       // 'image' | 'video' | 'audio' | 'file'
    fileName: string,
    fileSize: number,      // bytes
    mimeType: string,      // 'image/jpeg', 'video/mp4', etc.

    // Per file piccoli (<1MB)
    dataUrl?: string,      // data:image/jpeg;base64,...

    // Per file grandi (>1MB)
    fileId?: string,       // ID univoco file su server
    downloadUrl?: string,  // URL temporaneo download
    expiresAt?: ISO8601,   // Scadenza URL

    // Metadata
    width?: number,        // Per immagini/video
    height?: number,
    duration?: number,     // Per audio/video (secondi)
    thumbnail?: string,    // Base64 thumbnail per video

    // Local storage
    localUri?: string,     // Path locale dopo download
    downloaded: boolean
  },

  // Contact message
  contact?: {
    name: string,
    phone?: string,
    email?: string,
    vcard: string          // vCard completo
  },

  // Calendar event
  event?: {
    title: string,
    startDate: ISO8601,
    endDate: ISO8601,
    location?: string,
    description?: string,
    ical: string           // iCal completo
  },

  // Location (futuro)
  location?: {
    latitude: number,
    longitude: number,
    address?: string
  }
}
```

## Backend API

### Endpoints File Upload/Download

```csharp
// Program.cs - New endpoints

// Upload file
POST /api/upload
Content-Type: multipart/form-data
Body: {
  file: binary,
  encryptedKey: string,  // AES key crittografata per destinatari
  recipients: string[]   // Username destinatari
}
Response: {
  fileId: string,
  downloadUrl: string,
  expiresAt: ISO8601
}

// Download file
GET /api/download/{fileId}
Response: binary file

// Delete file (auto dopo 24h)
DELETE /api/files/{fileId}
```

### Server Storage

```csharp
// Temporary file storage
class FileStorage {
  private string _uploadDir = "./uploads";
  private TimeSpan _expiration = TimeSpan.FromHours(24);

  // Clean expired files every hour
  public void StartCleanupTask() {
    Timer timer = new Timer(CleanupExpiredFiles, null,
      TimeSpan.Zero, TimeSpan.FromHours(1));
  }

  public async Task<string> SaveFileAsync(IFormFile file) {
    string fileId = Guid.NewGuid().ToString();
    string filePath = Path.Combine(_uploadDir, fileId);

    using (var stream = new FileStream(filePath, FileMode.Create)) {
      await file.CopyToAsync(stream);
    }

    // Save metadata
    var metadata = new FileMetadata {
      FileId = fileId,
      FileName = file.FileName,
      ContentType = file.ContentType,
      Size = file.Length,
      UploadedAt = DateTime.UtcNow,
      ExpiresAt = DateTime.UtcNow.Add(_expiration)
    };

    SaveMetadata(metadata);
    return fileId;
  }
}
```

## Frontend Web

### File Upload

```javascript
// frontend/src/utils/mediaUpload.js

export class MediaUploader {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
    this.maxInlineSize = 1024 * 1024; // 1MB
  }

  // Upload immagine
  async uploadImage(file, encryptionKeys) {
    // Se piccola, converti in base64
    if (file.size <= this.maxInlineSize) {
      return await this.convertToBase64(file);
    }

    // Altrimenti upload su server
    return await this.uploadToServer(file, encryptionKeys);
  }

  // Converti in base64
  async convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Upload su server
  async uploadToServer(file, encryptionKeys) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('encryptedKey', JSON.stringify(encryptionKeys));

    const response = await fetch(`${this.serverUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    return {
      fileId: data.fileId,
      downloadUrl: data.downloadUrl,
      expiresAt: data.expiresAt
    };
  }

  // Download file
  async downloadFile(fileId) {
    const response = await fetch(
      `${this.serverUrl}/api/download/${fileId}`
    );
    return await response.blob();
  }
}
```

### Voice Recording

```javascript
// frontend/src/utils/audioRecorder.js

export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  async startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    this.mediaRecorder = new MediaRecorder(stream);
    this.audioChunks = [];

    this.mediaRecorder.ondataavailable = (event) => {
      this.audioChunks.push(event.data);
    };

    this.mediaRecorder.start();
  }

  async stopRecording() {
    return new Promise((resolve) => {
      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: 'audio/webm'
        });
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track =>
        track.stop()
      );
    });
  }
}
```

### UI Components

```javascript
// frontend/src/components/MediaMessage.jsx

export function MediaMessage({ message }) {
  switch (message.type) {
    case 'image':
      return <ImageMessage message={message} />;
    case 'video':
      return <VideoMessage message={message} />;
    case 'audio':
      return <AudioMessage message={message} />;
    case 'file':
      return <FileMessage message={message} />;
    case 'contact':
      return <ContactMessage message={message} />;
    case 'event':
      return <EventMessage message={message} />;
    default:
      return <TextMessage message={message} />;
  }
}

function ImageMessage({ message }) {
  const { media } = message;

  return (
    <div className="image-message">
      <img
        src={media.dataUrl || media.downloadUrl}
        alt={media.fileName}
        className="max-w-sm rounded-lg"
        onClick={() => openLightbox(media)}
      />
      <p className="text-xs text-gray-500">
        {media.fileName} • {formatFileSize(media.fileSize)}
      </p>
    </div>
  );
}

function AudioMessage({ message }) {
  const { media } = message;

  return (
    <div className="audio-message">
      <audio controls src={media.dataUrl || media.downloadUrl}>
        Your browser does not support audio.
      </audio>
      <p className="text-xs">
        🎤 Messaggio vocale • {formatDuration(media.duration)}
      </p>
    </div>
  );
}

function VideoMessage({ message }) {
  const { media } = message;

  return (
    <div className="video-message">
      <video
        controls
        src={media.dataUrl || media.downloadUrl}
        poster={media.thumbnail}
        className="max-w-sm rounded-lg"
      >
        Your browser does not support video.
      </video>
      <p className="text-xs text-gray-500">
        {media.fileName} • {formatFileSize(media.fileSize)}
      </p>
    </div>
  );
}

function FileMessage({ message }) {
  const { media } = message;
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    const blob = await downloadFile(media.fileId);
    saveAs(blob, media.fileName);
    setDownloading(false);
  };

  return (
    <div className="file-message flex items-center gap-3 p-3 bg-gray-100 rounded">
      <FileIcon type={media.mimeType} />
      <div className="flex-1">
        <p className="font-medium">{media.fileName}</p>
        <p className="text-xs text-gray-500">
          {formatFileSize(media.fileSize)}
        </p>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="btn-download"
      >
        {downloading ? '⏳' : '📥'}
      </button>
    </div>
  );
}

function ContactMessage({ message }) {
  const { contact } = message;

  const handleSaveContact = () => {
    const blob = new Blob([contact.vcard], { type: 'text/vcard' });
    saveAs(blob, `${contact.name}.vcf`);
  };

  return (
    <div className="contact-message">
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
        <div className="avatar">👤</div>
        <div className="flex-1">
          <p className="font-medium">{contact.name}</p>
          {contact.phone && <p className="text-sm">📞 {contact.phone}</p>}
          {contact.email && <p className="text-sm">✉️ {contact.email}</p>}
        </div>
        <button onClick={handleSaveContact}>
          Salva Contatto
        </button>
      </div>
    </div>
  );
}

function EventMessage({ message }) {
  const { event } = message;

  const handleAddToCalendar = () => {
    const blob = new Blob([event.ical], { type: 'text/calendar' });
    saveAs(blob, `${event.title}.ics`);
  };

  return (
    <div className="event-message">
      <div className="p-3 bg-purple-50 rounded">
        <p className="font-medium">📅 {event.title}</p>
        <p className="text-sm">
          🕐 {formatDate(event.startDate)} - {formatDate(event.endDate)}
        </p>
        {event.location && <p className="text-sm">📍 {event.location}</p>}
        <button onClick={handleAddToCalendar} className="mt-2">
          Aggiungi al Calendario
        </button>
      </div>
    </div>
  );
}
```

### Message Input with Media

```javascript
// frontend/src/components/MessageInput.jsx

export function MessageInput({ onSend }) {
  const [message, setMessage] = useState('');
  const [recording, setRecording] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const fileInputRef = useRef(null);
  const audioRecorder = useRef(new AudioRecorder());

  const handleSendText = () => {
    if (!message.trim()) return;
    onSend({ type: 'text', message });
    setMessage('');
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploader = new MediaUploader();
    const mediaData = await uploader.uploadImage(file);

    onSend({
      type: 'image',
      media: {
        type: 'image',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        ...mediaData
      }
    });
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploader = new MediaUploader();
    const mediaData = await uploader.uploadVideo(file);

    onSend({
      type: 'video',
      media: {
        type: 'video',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        ...mediaData
      }
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploader = new MediaUploader();
    const mediaData = await uploader.uploadFile(file);

    onSend({
      type: 'file',
      media: {
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        ...mediaData
      }
    });
  };

  const handleStartRecording = async () => {
    await audioRecorder.current.startRecording();
    setRecording(true);
  };

  const handleStopRecording = async () => {
    const audioBlob = await audioRecorder.current.stopRecording();
    setRecording(false);

    const uploader = new MediaUploader();
    const mediaData = await uploader.uploadAudio(audioBlob);

    onSend({
      type: 'audio',
      media: {
        type: 'audio',
        fileName: `voice-${Date.now()}.webm`,
        fileSize: audioBlob.size,
        mimeType: 'audio/webm',
        duration: await getAudioDuration(audioBlob),
        ...mediaData
      }
    });
  };

  return (
    <div className="message-input">
      {/* Media Menu */}
      {showMediaMenu && (
        <div className="media-menu">
          <button onClick={() => fileInputRef.current?.click()}>
            📸 Foto
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            🎥 Video
          </button>
          <button onClick={() => fileInputRef.current?.click()}>
            📎 File
          </button>
          <button onClick={handleStartRecording}>
            🎤 Audio
          </button>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,*/*"
        onChange={handleImageUpload}
        style={{ display: 'none' }}
      />

      {/* Recording indicator */}
      {recording && (
        <div className="recording-indicator">
          🔴 Registrazione in corso...
          <button onClick={handleStopRecording}>Stop</button>
        </div>
      )}

      {/* Text input */}
      <div className="input-container">
        <button
          onClick={() => setShowMediaMenu(!showMediaMenu)}
          className="media-button"
        >
          ➕
        </button>

        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendText()}
          placeholder="Scrivi un messaggio..."
        />

        <button onClick={handleSendText}>
          ➤
        </button>
      </div>
    </div>
  );
}
```

## Mobile React Native

### Dependencies

```json
{
  "dependencies": {
    "expo-image-picker": "~14.7.1",
    "expo-document-picker": "~11.10.1",
    "expo-av": "~13.10.5",
    "expo-contacts": "~12.8.0",
    "expo-calendar": "~12.9.0",
    "expo-location": "~16.5.3",
    "expo-file-system": "~16.0.6",
    "expo-sharing": "~12.0.1"
  }
}
```

### Media Picker

```javascript
// mobile/src/utils/mediaPicker.js

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';

export class MobileMediaPicker {
  // Pick immagine dalla galleria
  async pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      return {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        type: result.assets[0].type,
        width: result.assets[0].width,
        height: result.assets[0].height
      };
    }
  }

  // Scatta foto con camera
  async takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled) {
      return {
        uri: result.assets[0].uri,
        base64: result.assets[0].base64,
        type: result.assets[0].type
      };
    }
  }

  // Pick video
  async pickVideo() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.5
    });

    if (!result.canceled) {
      return {
        uri: result.assets[0].uri,
        duration: result.assets[0].duration
      };
    }
  }

  // Pick file generico
  async pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true
    });

    if (result.type === 'success') {
      return {
        uri: result.uri,
        name: result.name,
        size: result.size,
        mimeType: result.mimeType
      };
    }
  }

  // Pick contatto
  async pickContact() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    const result = await Contacts.presentContactPickerAsync();
    if (result) {
      // Converti in vCard
      const vcard = this.contactToVCard(result);
      return {
        name: result.name,
        phone: result.phoneNumbers?.[0]?.number,
        email: result.emails?.[0]?.email,
        vcard: vcard
      };
    }
  }

  // Pick evento calendario
  async pickCalendarEvent() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    // Mostra calendario picker (custom UI)
    // Per ora ritorna un evento di esempio
    return {
      title: 'Meeting',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 3600000).toISOString(),
      location: 'Office',
      ical: this.eventToICal(/* event data */)
    };
  }

  contactToVCard(contact) {
    return `BEGIN:VCARD
VERSION:3.0
FN:${contact.name}
TEL:${contact.phoneNumbers?.[0]?.number || ''}
EMAIL:${contact.emails?.[0]?.email || ''}
END:VCARD`;
  }

  eventToICal(event) {
    return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${event.title}
DTSTART:${event.startDate}
DTEND:${event.endDate}
LOCATION:${event.location || ''}
END:VEVENT
END:VCALENDAR`;
  }
}
```

### Audio Recording

```javascript
// mobile/src/utils/audioRecorder.js

import { Audio } from 'expo-av';

export class MobileAudioRecorder {
  constructor() {
    this.recording = null;
  }

  async startRecording() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Permission denied');
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true
    });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    this.recording = recording;
  }

  async stopRecording() {
    if (!this.recording) return null;

    await this.recording.stopAndUnloadAsync();
    const uri = this.recording.getURI();
    const status = await this.recording.getStatusAsync();

    this.recording = null;

    return {
      uri: uri,
      duration: status.durationMillis / 1000
    };
  }

  async pauseRecording() {
    if (this.recording) {
      await this.recording.pauseAsync();
    }
  }

  async resumeRecording() {
    if (this.recording) {
      await this.recording.startAsync();
    }
  }
}
```

### Media Message Components

```javascript
// mobile/src/components/MediaMessageItem.js

import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { Video } from 'expo-av';
import { Audio } from 'expo-av';

export function MediaMessageItem({ message }) {
  switch (message.type) {
    case 'image':
      return <ImageMessageItem message={message} />;
    case 'video':
      return <VideoMessageItem message={message} />;
    case 'audio':
      return <AudioMessageItem message={message} />;
    case 'file':
      return <FileMessageItem message={message} />;
    case 'contact':
      return <ContactMessageItem message={message} />;
    case 'event':
      return <EventMessageItem message={message} />;
    default:
      return <TextMessageItem message={message} />;
  }
}

function ImageMessageItem({ message }) {
  const { media } = message;

  return (
    <TouchableOpacity>
      <Image
        source={{ uri: media.dataUrl || media.localUri }}
        style={{ width: 250, height: 250, borderRadius: 8 }}
        resizeMode="cover"
      />
      <Text variant="caption">{media.fileName}</Text>
    </TouchableOpacity>
  );
}

function VideoMessageItem({ message }) {
  const { media } = message;
  const videoRef = useRef(null);

  return (
    <View>
      <Video
        ref={videoRef}
        source={{ uri: media.dataUrl || media.localUri }}
        useNativeControls
        resizeMode="contain"
        style={{ width: 250, height: 250, borderRadius: 8 }}
      />
      <Text variant="caption">
        🎥 {media.fileName} • {formatDuration(media.duration)}
      </Text>
    </View>
  );
}

function AudioMessageItem({ message }) {
  const { media } = message;
  const [sound, setSound] = useState(null);
  const [playing, setPlaying] = useState(false);

  const playAudio = async () => {
    if (sound) {
      await sound.playAsync();
      setPlaying(true);
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: media.dataUrl || media.localUri }
      );
      setSound(newSound);
      await newSound.playAsync();
      setPlaying(true);
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      await sound.pauseAsync();
      setPlaying(false);
    }
  };

  return (
    <Surface style={styles.audioMessage}>
      <IconButton
        icon={playing ? 'pause' : 'play'}
        onPress={playing ? pauseAudio : playAudio}
      />
      <Text>🎤 Messaggio vocale • {formatDuration(media.duration)}</Text>
    </Surface>
  );
}

function ContactMessageItem({ message }) {
  const { contact } = message;

  const handleSaveContact = async () => {
    // Salva in rubrica
    await Contacts.addContactAsync(contact);
    Alert.alert('Successo', 'Contatto salvato');
  };

  return (
    <Surface style={styles.contactMessage}>
      <Text variant="titleMedium">👤 {contact.name}</Text>
      {contact.phone && <Text>📞 {contact.phone}</Text>}
      {contact.email && <Text>✉️ {contact.email}</Text>}
      <Button mode="contained" onPress={handleSaveContact}>
        Salva Contatto
      </Button>
    </Surface>
  );
}
```

## Limiti e Considerazioni

### Dimensioni File

```javascript
const FILE_LIMITS = {
  image: {
    maxSize: 10 * 1024 * 1024,      // 10MB
    inlineThreshold: 1024 * 1024    // 1MB
  },
  video: {
    maxSize: 50 * 1024 * 1024,      // 50MB
    inlineThreshold: 0              // Mai inline
  },
  audio: {
    maxSize: 10 * 1024 * 1024,      // 10MB
    inlineThreshold: 1024 * 1024    // 1MB
  },
  file: {
    maxSize: 100 * 1024 * 1024,     // 100MB
    inlineThreshold: 512 * 1024     // 512KB
  }
};
```

### Server Temporary Storage

- File salvati in `./uploads` directory
- Auto-cancellazione dopo 24h
- Cleanup task ogni ora
- Max 1GB storage temporaneo
- Rate limiting: 10 upload/minuto per user

### Privacy

- File crittografati con E2EE prima dell'upload
- Server non può leggere contenuto file
- Cancellazione automatica garantisce privacy
- Export locale include tutti i media

### Performance

- Thumbnail generation per video
- Lazy loading immagini
- Progressive download per file grandi
- Cache locale per media visualizzati

---

**Versione**: 2.1.0
**Ultimo aggiornamento**: 2024-01-15
**Maintainer**: PieraChat Team
