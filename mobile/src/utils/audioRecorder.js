/**
 * Audio Recorder for React Native / Expo
 * Handles voice message recording with pause/resume functionality
 */

import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export class MobileAudioRecorder {
  constructor() {
    this.recording = null;
    this.sound = null;
    this.startTime = null;
    this.pausedDuration = 0;
    this.pauseStartTime = null;
    this.isPaused = false;
  }

  /**
   * Initialize audio mode
   */
  async initializeAudioMode() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    });
  }

  /**
   * Request microphone permissions
   */
  async requestPermissions() {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Accesso al microfono negato. Abilita i permessi nelle impostazioni.');
    }
    return true;
  }

  /**
   * Start recording
   */
  async startRecording() {
    try {
      await this.requestPermissions();
      await this.initializeAudioMode();

      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.isPaused = false;

      console.log('🎤 Recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }

  /**
   * Pause recording
   */
  async pauseRecording() {
    if (!this.recording || this.isPaused) {
      return;
    }

    try {
      await this.recording.pauseAsync();
      this.pauseStartTime = Date.now();
      this.isPaused = true;
      console.log('⏸ Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  /**
   * Resume recording
   */
  async resumeRecording() {
    if (!this.recording || !this.isPaused) {
      return;
    }

    try {
      // Calculate paused duration
      if (this.pauseStartTime) {
        this.pausedDuration += Date.now() - this.pauseStartTime;
        this.pauseStartTime = null;
      }

      await this.recording.startAsync();
      this.isPaused = false;
      console.log('▶️ Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  /**
   * Stop recording and return audio data
   */
  async stopRecording() {
    if (!this.recording) {
      throw new Error('No active recording');
    }

    try {
      // Stop recording
      await this.recording.stopAndUnloadAsync();

      // Get recording URI
      const uri = this.recording.getURI();

      // Calculate actual recording duration (excluding paused time)
      const totalDuration = (Date.now() - this.startTime - this.pausedDuration) / 1000;

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64
      });

      // Create data URL
      const dataUrl = `data:audio/m4a;base64,${base64}`;

      // Create blob-like object for React Native
      const audioData = {
        uri: uri,
        base64: base64,
        dataUrl: dataUrl,
        size: fileInfo.size || 0,
        duration: totalDuration
      };

      // Reset state
      this.recording = null;
      this.startTime = null;
      this.pausedDuration = 0;
      this.pauseStartTime = null;
      this.isPaused = false;

      console.log('✅ Recording stopped:', {
        duration: totalDuration,
        size: audioData.size
      });

      return audioData;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      throw error;
    }
  }

  /**
   * Cancel recording without saving
   */
  async cancelRecording() {
    if (!this.recording) {
      return;
    }

    try {
      await this.recording.stopAndUnloadAsync();

      // Delete the recorded file
      const uri = this.recording.getURI();
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      // Reset state
      this.recording = null;
      this.startTime = null;
      this.pausedDuration = 0;
      this.pauseStartTime = null;
      this.isPaused = false;

      console.log('❌ Recording cancelled');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      throw error;
    }
  }

  /**
   * Get current recording duration (in seconds)
   */
  getDuration() {
    if (!this.startTime) {
      return 0;
    }

    const elapsed = Date.now() - this.startTime;
    const pausedTime = this.isPaused
      ? this.pausedDuration + (Date.now() - this.pauseStartTime)
      : this.pausedDuration;

    return (elapsed - pausedTime) / 1000;
  }

  /**
   * Check if currently recording
   */
  isRecording() {
    return this.recording !== null && !this.isPaused;
  }

  /**
   * Check if recording is paused
   */
  isRecordingPaused() {
    return this.isPaused;
  }

  /**
   * Get recording status
   */
  async getStatus() {
    if (!this.recording) {
      return null;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return {
        isRecording: status.isRecording,
        isDoneRecording: status.isDoneRecording,
        durationMillis: status.durationMillis,
        metering: status.metering
      };
    } catch (error) {
      console.error('Failed to get status:', error);
      return null;
    }
  }
}

/**
 * Audio Player for playing received voice messages
 */
export class MobileAudioPlayer {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
    this.duration = 0;
    this.position = 0;
  }

  /**
   * Load audio from URI or data URL
   */
  async loadAudio(uri) {
    try {
      // Unload previous sound if any
      if (this.sound) {
        await this.unloadAudio();
      }

      // Initialize audio mode for playback
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false
      });

      // Load sound
      const { sound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.duration = status.durationMillis / 1000;

      console.log('🔊 Audio loaded:', { duration: this.duration });
      return true;
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * Play audio
   */
  async play() {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.playAsync();
      this.isPlaying = true;
      console.log('▶️ Playing audio');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause audio
   */
  async pause() {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.pauseAsync();
      this.isPlaying = false;
      console.log('⏸ Audio paused');
    } catch (error) {
      console.error('Failed to pause audio:', error);
      throw error;
    }
  }

  /**
   * Stop audio
   */
  async stop() {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      this.isPlaying = false;
      this.position = 0;
      console.log('⏹ Audio stopped');
    } catch (error) {
      console.error('Failed to stop audio:', error);
      throw error;
    }
  }

  /**
   * Seek to position (in seconds)
   */
  async seekTo(positionSeconds) {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setPositionAsync(positionSeconds * 1000);
      this.position = positionSeconds;
    } catch (error) {
      console.error('Failed to seek:', error);
      throw error;
    }
  }

  /**
   * Unload audio and free resources
   */
  async unloadAudio() {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
      this.duration = 0;
      this.position = 0;
      console.log('🔇 Audio unloaded');
    } catch (error) {
      console.error('Failed to unload audio:', error);
      throw error;
    }
  }

  /**
   * Playback status update callback
   */
  onPlaybackStatusUpdate(status) {
    if (status.isLoaded) {
      this.position = status.positionMillis / 1000;
      this.duration = status.durationMillis / 1000;
      this.isPlaying = status.isPlaying;

      // Check if playback finished
      if (status.didJustFinish) {
        this.isPlaying = false;
        this.position = 0;
        console.log('✅ Audio playback finished');
      }
    }
  }

  /**
   * Get current playback position (in seconds)
   */
  getPosition() {
    return this.position;
  }

  /**
   * Get total duration (in seconds)
   */
  getDuration() {
    return this.duration;
  }

  /**
   * Check if audio is currently playing
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}

export default MobileAudioRecorder;
