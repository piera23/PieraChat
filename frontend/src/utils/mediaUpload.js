/**
 * Media Upload Manager
 * Handles file upload/download for multimedia messaging
 * Supports: images, videos, audio, files
 */

const MAX_INLINE_SIZE = 1024 * 1024; // 1MB - files smaller than this are converted to base64
const MAX_FILE_SIZE = 104857600; // 100MB

export class MediaUploader {
  constructor(serverUrl = '') {
    this.serverUrl = serverUrl || window.location.origin;
  }

  /**
   * Check if file should be sent inline (base64) or uploaded to server
   */
  shouldSendInline(fileSize) {
    return fileSize <= MAX_INLINE_SIZE;
  }

  /**
   * Convert file to base64 data URL
   */
  async convertToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Get file type category
   */
  getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'file';
  }

  /**
   * Upload image
   */
  async uploadImage(file, username) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large (max 100MB)');
    }

    // Small files: convert to base64
    if (this.shouldSendInline(file.size)) {
      const dataUrl = await this.convertToBase64(file);

      // Get image dimensions
      const dimensions = await this.getImageDimensions(file);

      return {
        type: 'image',
        media: {
          type: 'image',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          downloaded: true
        }
      };
    }

    // Large files: upload to server
    const uploadResult = await this.uploadToServer(file, username);

    return {
      type: 'image',
      media: {
        type: 'image',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId,
        downloadUrl: uploadResult.downloadUrl,
        expiresAt: uploadResult.expiresAt,
        downloaded: false
      }
    };
  }

  /**
   * Upload video
   */
  async uploadVideo(file, username) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large (max 100MB)');
    }

    // Videos are usually large, upload to server
    const uploadResult = await this.uploadToServer(file, username);

    // Generate thumbnail
    const thumbnail = await this.generateVideoThumbnail(file);

    return {
      type: 'video',
      media: {
        type: 'video',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId,
        downloadUrl: uploadResult.downloadUrl,
        expiresAt: uploadResult.expiresAt,
        thumbnail: thumbnail,
        downloaded: false
      }
    };
  }

  /**
   * Upload audio (voice message)
   */
  async uploadAudio(blob, username, duration = 0) {
    const file = new File([blob], `voice-${Date.now()}.webm`, {
      type: 'audio/webm'
    });

    if (file.size > MAX_FILE_SIZE) {
      throw new Error('Audio too large (max 100MB)');
    }

    // Small audio: inline
    if (this.shouldSendInline(file.size)) {
      const dataUrl = await this.convertToBase64(file);

      return {
        type: 'audio',
        media: {
          type: 'audio',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl: dataUrl,
          duration: duration,
          downloaded: true
        }
      };
    }

    // Large audio: upload
    const uploadResult = await this.uploadToServer(file, username);

    return {
      type: 'audio',
      media: {
        type: 'audio',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId,
        downloadUrl: uploadResult.downloadUrl,
        expiresAt: uploadResult.expiresAt,
        duration: duration,
        downloaded: false
      }
    };
  }

  /**
   * Upload generic file
   */
  async uploadFile(file, username) {
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large (max 100MB)');
    }

    // Small files: inline
    if (this.shouldSendInline(file.size)) {
      const dataUrl = await this.convertToBase64(file);

      return {
        type: 'file',
        media: {
          type: 'file',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          dataUrl: dataUrl,
          downloaded: true
        }
      };
    }

    // Large files: upload
    const uploadResult = await this.uploadToServer(file, username);

    return {
      type: 'file',
      media: {
        type: 'file',
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        fileId: uploadResult.fileId,
        downloadUrl: uploadResult.downloadUrl,
        expiresAt: uploadResult.expiresAt,
        downloaded: false
      }
    };
  }

  /**
   * Upload file to server
   */
  async uploadToServer(file, username) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('username', username);

    const response = await fetch(`${this.serverUrl}/api/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return {
      fileId: data.fileId,
      downloadUrl: `${this.serverUrl}${data.downloadUrl}`,
      expiresAt: data.expiresAt
    };
  }

  /**
   * Download file from server
   */
  async downloadFile(fileId, fileName) {
    const response = await fetch(`${this.serverUrl}/api/download/${fileId}`);

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();

    // Save file
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return blob;
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.width,
          height: img.height
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };

      img.src = url;
    });
  }

  /**
   * Generate video thumbnail
   */
  async generateVideoThumbnail(file) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadeddata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    });
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

export default MediaUploader;
