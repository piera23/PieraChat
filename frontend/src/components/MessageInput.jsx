import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, Image, Video, File, Mic, X, Paperclip, StopCircle, Pause, Play } from 'lucide-react';
import { MediaUploader, formatFileSize, formatDuration } from '../utils/mediaUpload';
import { AudioRecorder } from '../utils/audioRecorder';

const MessageInput = ({ onSendMessage, onTyping, isConnected, username }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mediaUploaderRef = useRef(new MediaUploader());
  const audioRecorderRef = useRef(new AudioRecorder());
  const recordingIntervalRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioRecorderRef.current.isRecording()) {
        audioRecorderRef.current.cancelRecording();
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;

    onSendMessage({ type: 'text', message: trimmedMessage });
    setMessage('');

    // Stop typing indicator
    if (isTyping) {
      onTyping(false);
      setIsTyping(false);
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);

    // Handle typing indicator
    if (!isTyping && e.target.value.trim()) {
      onTyping(true);
      setIsTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        onTyping(false);
        setIsTyping(false);
      }
    }, 1000);
  };

  // Image upload
  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowMediaMenu(false);
    setSelectedFile({ file, type: 'image' });
  };

  // Video upload
  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowMediaMenu(false);
    setSelectedFile({ file, type: 'video' });
  };

  // File upload
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowMediaMenu(false);
    setSelectedFile({ file, type: 'file' });
  };

  // Send selected file
  const handleSendFile = async () => {
    if (!selectedFile || !isConnected || uploading) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploader = mediaUploaderRef.current;
      let messageData;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      if (selectedFile.type === 'image') {
        messageData = await uploader.uploadImage(selectedFile.file, username);
      } else if (selectedFile.type === 'video') {
        messageData = await uploader.uploadVideo(selectedFile.file, username);
      } else {
        messageData = await uploader.uploadFile(selectedFile.file, username);
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Send message
      onSendMessage(messageData);

      // Clear selected file
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
      alert(`Errore upload: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Cancel file selection
  const handleCancelFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  // Start voice recording
  const handleStartRecording = async () => {
    try {
      await audioRecorderRef.current.startRecording();
      setRecording(true);
      setRecordingDuration(0);

      // Update duration every 100ms
      recordingIntervalRef.current = setInterval(() => {
        const duration = audioRecorderRef.current.getDuration();
        setRecordingDuration(duration);
      }, 100);
    } catch (error) {
      console.error('Recording failed:', error);
      alert(`Errore registrazione: ${error.message}`);
    }
  };

  // Stop voice recording
  const handleStopRecording = async () => {
    try {
      const { blob, duration } = await audioRecorderRef.current.stopRecording();

      // Clear interval
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      setRecording(false);
      setRecordingPaused(false);
      setRecordingDuration(0);

      // Upload audio
      setUploading(true);
      const uploader = mediaUploaderRef.current;
      const messageData = await uploader.uploadAudio(blob, username, duration);
      setUploading(false);

      // Send message
      onSendMessage(messageData);
    } catch (error) {
      console.error('Failed to send voice message:', error);
      alert(`Errore invio audio: ${error.message}`);
      setUploading(false);
    }
  };

  // Pause/Resume recording
  const handlePauseResumeRecording = () => {
    if (recordingPaused) {
      audioRecorderRef.current.resumeRecording();
      setRecordingPaused(false);
    } else {
      audioRecorderRef.current.pauseRecording();
      setRecordingPaused(true);
    }
  };

  // Cancel recording
  const handleCancelRecording = () => {
    audioRecorderRef.current.cancelRecording();

    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }

    setRecording(false);
    setRecordingPaused(false);
    setRecordingDuration(0);
  };

  // If recording, show recording UI
  if (recording) {
    return (
      <div className="p-4 border-t bg-gradient-to-r from-red-50 to-pink-50">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full animate-pulse" />
            </div>

            <div>
              <p className="font-medium text-gray-800">Registrazione in corso...</p>
              <p className="text-sm text-gray-600">{formatDuration(recordingDuration)}</p>
            </div>
          </div>

          <button
            onClick={handlePauseResumeRecording}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title={recordingPaused ? 'Riprendi' : 'Pausa'}
          >
            {recordingPaused ? (
              <Play className="w-5 h-5 text-gray-700" />
            ) : (
              <Pause className="w-5 h-5 text-gray-700" />
            )}
          </button>

          <button
            onClick={handleCancelRecording}
            className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            title="Annulla"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={handleStopRecording}
            disabled={uploading}
            className="p-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg transition-all disabled:opacity-50"
            title="Invia"
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // If file selected, show preview
  if (selectedFile) {
    return (
      <div className="p-4 border-t bg-blue-50">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">File selezionato:</p>
            <button
              onClick={handleCancelFile}
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
            <div className="text-3xl">
              {selectedFile.type === 'image' && '🖼️'}
              {selectedFile.type === 'video' && '🎥'}
              {selectedFile.type === 'file' && '📎'}
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{selectedFile.file.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.file.size)}
              </p>
            </div>
          </div>

          {/* Upload progress */}
          {uploading && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {uploadProgress}%
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSendFile}
          disabled={uploading}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2 rounded-lg hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Caricamento...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Invia {selectedFile.type === 'image' ? 'Immagine' : selectedFile.type === 'video' ? 'Video' : 'File'}
            </>
          )}
        </button>
      </div>
    );
  }

  // Normal text input with media buttons
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white relative">
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Media menu */}
      {showMediaMenu && (
        <div className="absolute bottom-20 left-4 bg-white rounded-lg shadow-xl border p-2 z-10">
          <button
            type="button"
            onClick={() => {
              imageInputRef.current?.click();
              setShowMediaMenu(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Image className="w-5 h-5 text-blue-500" />
            <span>Foto</span>
          </button>

          <button
            type="button"
            onClick={() => {
              videoInputRef.current?.click();
              setShowMediaMenu(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Video className="w-5 h-5 text-purple-500" />
            <span>Video</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fileInputRef.current?.click();
              setShowMediaMenu(false);
            }}
            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <File className="w-5 h-5 text-gray-500" />
            <span>File</span>
          </button>

          <div className="border-t my-1" />

          <button
            type="button"
            onClick={() => {
              setShowMediaMenu(false);
              handleStartRecording();
            }}
            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Mic className="w-5 h-5 text-red-500" />
            <span>Messaggio Vocale</span>
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {/* Media menu toggle */}
        <button
          type="button"
          onClick={() => setShowMediaMenu(!showMediaMenu)}
          disabled={!isConnected}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          title="Allega media"
        >
          {showMediaMenu ? (
            <X className="w-5 h-5 text-gray-600" />
          ) : (
            <Plus className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {/* Text input */}
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={isConnected ? 'Scrivi un messaggio...' : 'Connessione in corso...'}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!isConnected}
          maxLength={1000}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!isConnected || !message.trim()}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 rounded-full hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
