/**
 * Media Picker for React Native / Expo
 * Handles image, video, and file selection with native pickers
 */

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Contacts from 'expo-contacts';
import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

const MAX_INLINE_SIZE = 1024 * 1024; // 1MB
const MAX_FILE_SIZE = 104857600; // 100MB

export class MediaPickerManager {
  /**
   * Request camera permissions
   */
  async requestCameraPermissions() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Accesso alla fotocamera negato. Abilita i permessi nelle impostazioni.');
    }
    return true;
  }

  /**
   * Request media library permissions
   */
  async requestMediaLibraryPermissions() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Accesso alla galleria negato. Abilita i permessi nelle impostazioni.');
    }
    return true;
  }

  /**
   * Request contacts permissions
   */
  async requestContactsPermissions() {
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Accesso ai contatti negato. Abilita i permessi nelle impostazioni.');
    }
    return true;
  }

  /**
   * Request calendar permissions
   */
  async requestCalendarPermissions() {
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Accesso al calendario negato. Abilita i permessi nelle impostazioni.');
    }
    return true;
  }

  /**
   * Pick an image from the gallery
   */
  async pickImage() {
    await this.requestMediaLibraryPermissions();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return this.processImageAsset(asset);
  }

  /**
   * Take a photo with the camera
   */
  async takePhoto() {
    await this.requestCameraPermissions();

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return this.processImageAsset(asset);
  }

  /**
   * Process image asset into message format
   */
  async processImageAsset(asset) {
    const fileName = asset.uri.split('/').pop();
    const fileSize = asset.fileSize || 0;

    // For small images, convert to base64
    if (fileSize <= MAX_INLINE_SIZE && fileSize > 0) {
      const base64 = await this.convertToBase64(asset.uri);

      return {
        type: 'image',
        media: {
          type: 'image',
          fileName: fileName,
          fileSize: fileSize,
          mimeType: 'image/jpeg',
          dataUrl: base64,
          width: asset.width,
          height: asset.height,
          downloaded: true
        }
      };
    }

    // For large images, we'll need to upload to server
    return {
      type: 'image',
      media: {
        type: 'image',
        fileName: fileName,
        fileSize: fileSize,
        mimeType: 'image/jpeg',
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        downloaded: false,
        needsUpload: true
      }
    };
  }

  /**
   * Pick a video from the gallery
   */
  async pickVideo() {
    await this.requestMediaLibraryPermissions();

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 180 // 3 minutes max
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return this.processVideoAsset(asset);
  }

  /**
   * Record a video with the camera
   */
  async recordVideo() {
    await this.requestCameraPermissions();

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      videoMaxDuration: 180
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return this.processVideoAsset(asset);
  }

  /**
   * Process video asset into message format
   */
  async processVideoAsset(asset) {
    const fileName = asset.uri.split('/').pop();
    const fileSize = asset.fileSize || 0;

    // Videos are typically large, always upload to server
    return {
      type: 'video',
      media: {
        type: 'video',
        fileName: fileName,
        fileSize: fileSize,
        mimeType: 'video/mp4',
        uri: asset.uri,
        duration: asset.duration || 0,
        width: asset.width,
        height: asset.height,
        downloaded: false,
        needsUpload: true
      }
    };
  }

  /**
   * Pick a document file
   */
  async pickDocument() {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    const fileSize = asset.size || 0;

    if (fileSize > MAX_FILE_SIZE) {
      throw new Error('File troppo grande (max 100MB)');
    }

    // For small files, convert to base64
    if (fileSize <= MAX_INLINE_SIZE) {
      const base64 = await this.convertToBase64(asset.uri);

      return {
        type: 'file',
        media: {
          type: 'file',
          fileName: asset.name,
          fileSize: fileSize,
          mimeType: asset.mimeType || 'application/octet-stream',
          dataUrl: base64,
          downloaded: true
        }
      };
    }

    // For large files, upload to server
    return {
      type: 'file',
      media: {
        type: 'file',
        fileName: asset.name,
        fileSize: fileSize,
        mimeType: asset.mimeType || 'application/octet-stream',
        uri: asset.uri,
        downloaded: false,
        needsUpload: true
      }
    };
  }

  /**
   * Pick a contact from the address book
   */
  async pickContact() {
    await this.requestContactsPermissions();

    // Note: Expo Contacts doesn't have a native picker UI
    // This is a simplified version - you may want to create a custom UI
    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.PhoneNumbers,
        Contacts.Fields.Emails
      ]
    });

    if (data.length === 0) {
      throw new Error('Nessun contatto trovato');
    }

    // For demonstration, pick the first contact
    // In production, you'd show a picker UI
    const contact = data[0];

    return {
      type: 'contact',
      contact: {
        name: contact.name || 'Sconosciuto',
        phoneNumbers: contact.phoneNumbers?.map(p => p.number) || [],
        emails: contact.emails?.map(e => e.email) || []
      }
    };
  }

  /**
   * Pick a calendar event
   */
  async pickCalendarEvent() {
    await this.requestCalendarPermissions();

    const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

    if (calendars.length === 0) {
      throw new Error('Nessun calendario trovato');
    }

    // Get events from the next 30 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const events = await Calendar.getEventsAsync(
      calendars.map(c => c.id),
      startDate,
      endDate
    );

    if (events.length === 0) {
      throw new Error('Nessun evento trovato');
    }

    // For demonstration, pick the first event
    // In production, you'd show a picker UI
    const event = events[0];

    return {
      type: 'event',
      event: {
        title: event.title || 'Evento',
        description: event.notes || '',
        location: event.location || '',
        startDate: event.startDate,
        endDate: event.endDate,
        allDay: event.allDay || false
      }
    };
  }

  /**
   * Convert file URI to base64 data URL
   */
  async convertToBase64(uri) {
    if (Platform.OS === 'web') {
      // Web platform uses FileReader
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // React Native uses FileSystem
      const FileSystem = require('expo-file-system').default;
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Determine MIME type from file extension
      const extension = uri.split('.').pop().toLowerCase();
      let mimeType = 'application/octet-stream';

      if (['jpg', 'jpeg'].includes(extension)) mimeType = 'image/jpeg';
      else if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'mp4') mimeType = 'video/mp4';
      else if (extension === 'webm') mimeType = 'audio/webm';
      else if (extension === 'pdf') mimeType = 'application/pdf';

      return `data:${mimeType};base64,${base64}`;
    }
  }

  /**
   * Upload file to server (for large files)
   */
  async uploadToServer(uri, fileName, mimeType, username, serverUrl) {
    const formData = new FormData();

    formData.append('file', {
      uri: uri,
      type: mimeType,
      name: fileName
    });
    formData.append('username', username);

    const response = await fetch(`${serverUrl}/api/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload fallito');
    }

    const data = await response.json();
    return {
      fileId: data.fileId,
      downloadUrl: `${serverUrl}${data.downloadUrl}`,
      expiresAt: data.expiresAt
    };
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Format duration for display (seconds to mm:ss)
 */
export function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get file icon based on MIME type
 */
export function getFileIcon(mimeType) {
  if (!mimeType) return '📎';

  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
    return '📊';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar'))
    return '📦';
  if (mimeType.includes('audio')) return '🎵';
  if (mimeType.includes('video')) return '🎥';
  if (mimeType.includes('image')) return '🖼️';
  return '📎';
}

export default MediaPickerManager;
