/**
 * Audio Recorder for Voice Messages
 * Uses MediaRecorder API for recording audio in the browser
 */

export class AudioRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.stream = null;
    this.startTime = null;
    this.isPaused = false;
  }

  /**
   * Check if browser supports audio recording
   */
  isSupported() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Start recording
   */
  async startRecording() {
    if (!this.isSupported()) {
      throw new Error('Audio recording not supported in this browser');
    }

    try {
      // Request microphone permission
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Create MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };

      // Fallback to default if webm not supported
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }

      this.mediaRecorder = new MediaRecorder(this.stream, options);
      this.audioChunks = [];
      this.startTime = Date.now();
      this.isPaused = false;

      // Collect audio data
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Start recording
      this.mediaRecorder.start(100); // Collect data every 100ms

      console.log('🎤 Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);

      if (error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied');
      } else if (error.name === 'NotFoundError') {
        throw new Error('No microphone found');
      } else {
        throw new Error('Failed to access microphone');
      }
    }
  }

  /**
   * Pause recording
   */
  pauseRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      this.isPaused = true;
      console.log('⏸️ Recording paused');
    }
  }

  /**
   * Resume recording
   */
  resumeRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      this.isPaused = false;
      console.log('▶️ Recording resumed');
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording() {
    if (!this.mediaRecorder) {
      throw new Error('No active recording');
    }

    return new Promise((resolve, reject) => {
      const handleStop = () => {
        // Create audio blob
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder.mimeType
        });

        // Calculate duration
        const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;

        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach((track) => track.stop());
          this.stream = null;
        }

        // Reset state
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.startTime = null;
        this.isPaused = false;

        console.log('🎤 Recording stopped');

        resolve({
          blob: audioBlob,
          duration: duration
        });
      };

      this.mediaRecorder.onstop = handleStop;
      this.mediaRecorder.onerror = (error) => {
        console.error('Recording error:', error);
        reject(new Error('Recording failed'));
      };

      // Stop recording
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }
    });
  }

  /**
   * Cancel recording (discard audio)
   */
  cancelRecording() {
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Stop all tracks
      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      // Reset state
      this.mediaRecorder = null;
      this.audioChunks = [];
      this.startTime = null;
      this.isPaused = false;

      console.log('❌ Recording canceled');
    }
  }

  /**
   * Get current recording duration in seconds
   */
  getDuration() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  /**
   * Get recording state
   */
  getState() {
    if (!this.mediaRecorder) return 'inactive';
    return this.mediaRecorder.state;
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }
}

/**
 * Play audio from blob or data URL
 */
export async function playAudio(source) {
  const audio = new Audio();

  if (source instanceof Blob) {
    audio.src = URL.createObjectURL(source);
  } else {
    audio.src = source;
  }

  try {
    await audio.play();
  } catch (error) {
    console.error('Failed to play audio:', error);
    throw error;
  }

  // Cleanup URL when done
  audio.onended = () => {
    if (source instanceof Blob) {
      URL.revokeObjectURL(audio.src);
    }
  };

  return audio;
}

/**
 * Get audio duration from blob
 */
export async function getAudioDuration(blob) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(audio.duration);
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio'));
    };

    audio.src = url;
  });
}

export default AudioRecorder;
