import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Appbar, TextInput, IconButton, Text, Surface, Badge, Portal, Modal, List, Button, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMobilePieraServer } from '../hooks/useMobilePieraServer';
import MessageItem from '../components/MessageItem';
import TypingIndicator from '../components/TypingIndicator';
import HistoryMenu from '../components/HistoryMenu';
import { COLORS, CONNECTION_STATES, SERVER_URL } from '../config/constants';
import { MediaPickerManager, formatFileSize, formatDuration } from '../utils/mediaPicker';
import { MobileAudioRecorder } from '../utils/audioRecorder';

export default function ChatScreen({ route, navigation }) {
  const { username } = route.params;
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recordingPaused, setRecordingPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const mediaPickerRef = useRef(new MediaPickerManager());
  const audioRecorderRef = useRef(new MobileAudioRecorder());
  const recordingIntervalRef = useRef(null);

  const {
    connectionState,
    messages,
    onlineUsers,
    typingUsers,
    error,
    sendMessage: sendWsMessage,
    sendTyping,
    isConnected,
    historyLoaded,
    clearHistory,
    exportChat,
    exportChatText,
    getStorageStats
  } = useMobilePieraServer(username);

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

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !isConnected) return;

    sendWsMessage(trimmed);
    setMessage('');

    if (isTyping) {
      sendTyping(false);
      setIsTyping(false);
    }
  };

  const handleTextChange = (text) => {
    setMessage(text);

    if (!isTyping && text.trim()) {
      sendTyping(true);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        sendTyping(false);
        setIsTyping(false);
      }
    }, 1000);
  };

  const handleShowHistory = async () => {
    setShowHistory(true);
    // Load storage stats when opening menu
    const stats = await getStorageStats();
    setStorageStats(stats);
  };

  const handleExportJSON = async () => {
    await exportChat();
  };

  const handleExportText = async () => {
    await exportChatText();
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setShowHistory(false);
  };

  // Media handling functions
  const handlePickImage = async () => {
    try {
      setShowMediaMenu(false);
      const result = await mediaPickerRef.current.pickImage();
      if (result) {
        setSelectedMedia(result);
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handleTakePhoto = async () => {
    try {
      setShowMediaMenu(false);
      const result = await mediaPickerRef.current.takePhoto();
      if (result) {
        setSelectedMedia(result);
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handlePickVideo = async () => {
    try {
      setShowMediaMenu(false);
      const result = await mediaPickerRef.current.pickVideo();
      if (result) {
        setSelectedMedia(result);
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handlePickDocument = async () => {
    try {
      setShowMediaMenu(false);
      const result = await mediaPickerRef.current.pickDocument();
      if (result) {
        setSelectedMedia(result);
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handleSendMedia = async () => {
    if (!selectedMedia || uploading) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      let messageData = selectedMedia;

      // If media needs upload (large file), upload to server first
      if (selectedMedia.media?.needsUpload) {
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 0.1, 0.9));
        }, 100);

        const uploadResult = await mediaPickerRef.current.uploadToServer(
          selectedMedia.media.uri,
          selectedMedia.media.fileName,
          selectedMedia.media.mimeType,
          username,
          SERVER_URL
        );

        clearInterval(progressInterval);
        setUploadProgress(1);

        // Update message data with upload info
        messageData = {
          ...selectedMedia,
          media: {
            ...selectedMedia.media,
            fileId: uploadResult.fileId,
            downloadUrl: uploadResult.downloadUrl,
            expiresAt: uploadResult.expiresAt,
            needsUpload: false
          }
        };
      }

      // Send message
      sendWsMessage(messageData);

      // Clear selection
      setSelectedMedia(null);
      setUploadProgress(0);
    } catch (error) {
      Alert.alert('Errore', `Upload fallito: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCancelMedia = () => {
    setSelectedMedia(null);
    setUploadProgress(0);
  };

  // Voice recording functions
  const handleStartRecording = async () => {
    try {
      setShowMediaMenu(false);
      await audioRecorderRef.current.startRecording();
      setRecording(true);
      setRecordingDuration(0);

      recordingIntervalRef.current = setInterval(() => {
        const duration = audioRecorderRef.current.getDuration();
        setRecordingDuration(duration);
      }, 100);
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handleStopRecording = async () => {
    try {
      const audioData = await audioRecorderRef.current.stopRecording();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      setRecording(false);
      setRecordingPaused(false);
      setRecordingDuration(0);

      // Create audio message
      const messageData = {
        type: 'audio',
        media: {
          type: 'audio',
          fileName: `voice-${Date.now()}.m4a`,
          fileSize: audioData.size,
          mimeType: 'audio/m4a',
          dataUrl: audioData.dataUrl,
          duration: audioData.duration,
          downloaded: true
        }
      };

      // Send message
      sendWsMessage(messageData);
    } catch (error) {
      Alert.alert('Errore', `Invio messaggio vocale fallito: ${error.message}`);
    }
  };

  const handlePauseResumeRecording = async () => {
    try {
      if (recordingPaused) {
        await audioRecorderRef.current.resumeRecording();
        setRecordingPaused(false);
      } else {
        await audioRecorderRef.current.pauseRecording();
        setRecordingPaused(true);
      }
    } catch (error) {
      Alert.alert('Errore', error.message);
    }
  };

  const handleCancelRecording = async () => {
    try {
      await audioRecorderRef.current.cancelRecording();

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }

      setRecording(false);
      setRecordingPaused(false);
      setRecordingDuration(0);
    } catch (error) {
      console.error('Cancel recording error:', error);
    }
  };

  const getConnectionIcon = () => {
    switch (connectionState) {
      case CONNECTION_STATES.CONNECTED:
        return { name: 'wifi', color: COLORS.success };
      case CONNECTION_STATES.CONNECTING:
        return { name: 'wifi-strength-outline', color: COLORS.textSecondary };
      case CONNECTION_STATES.ERROR:
        return { name: 'wifi-off', color: COLORS.error };
      default:
        return { name: 'wifi-off', color: COLORS.textSecondary };
    }
  };

  const connectionIcon = getConnectionIcon();
  const filteredTypingUsers = Array.from(typingUsers).filter(u => u !== username);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Appbar.Header elevated>
        <Appbar.Content
          title="PieraChat"
          subtitle={historyLoaded ? `${username} • ${messages.length} msg locali` : username}
        />
        <MaterialCommunityIcons
          name={connectionIcon.name}
          size={24}
          color={connectionIcon.color}
          style={styles.connectionIcon}
        />
        <Appbar.Action
          icon="database"
          onPress={handleShowHistory}
        />
        <Appbar.Action
          icon="account-group"
          onPress={() => setShowUsers(true)}
        />
        <Badge style={styles.badge}>{onlineUsers.length}</Badge>
        {historyLoaded && (
          <Badge style={styles.historyBadge}>
            <MaterialCommunityIcons name="hard-drive" size={10} color="white" />
          </Badge>
        )}
      </Appbar.Header>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageItem message={item} currentUsername={username} />
          )}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {filteredTypingUsers.length > 0 && (
          <TypingIndicator users={filteredTypingUsers} />
        )}

        {/* Recording UI */}
        {recording && (
          <Surface style={styles.recordingContainer} elevation={4}>
            <View style={styles.recordingContent}>
              <View style={styles.recordingIndicator}>
                <MaterialCommunityIcons name="microphone" size={24} color="white" />
                <View style={styles.recordingPulse} />
              </View>
              <View style={styles.recordingInfo}>
                <Text variant="bodyMedium" style={styles.recordingText}>
                  Registrazione in corso...
                </Text>
                <Text variant="bodySmall" style={styles.recordingDuration}>
                  {formatDuration(recordingDuration)}
                </Text>
              </View>
              <IconButton
                icon={recordingPaused ? 'play' : 'pause'}
                size={24}
                iconColor={COLORS.text}
                onPress={handlePauseResumeRecording}
              />
              <IconButton
                icon="close"
                size={24}
                iconColor={COLORS.error}
                onPress={handleCancelRecording}
              />
              <IconButton
                icon="send"
                size={24}
                iconColor={COLORS.primary}
                onPress={handleStopRecording}
              />
            </View>
          </Surface>
        )}

        {/* Media Preview */}
        {selectedMedia && !recording && (
          <Surface style={styles.mediaPreviewContainer} elevation={4}>
            <View style={styles.mediaPreviewContent}>
              <View style={styles.mediaPreviewTop}>
                <Text variant="labelSmall">File selezionato:</Text>
                <IconButton icon="close" size={20} onPress={handleCancelMedia} />
              </View>

              {selectedMedia.type === 'image' && selectedMedia.media.uri && (
                <Image
                  source={{ uri: selectedMedia.media.dataUrl || selectedMedia.media.uri }}
                  style={styles.mediaPreviewImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.mediaPreviewInfo}>
                <Text variant="bodyMedium">
                  {selectedMedia.media.fileName}
                </Text>
                <Text variant="bodySmall" style={styles.mediaPreviewSize}>
                  {formatFileSize(selectedMedia.media.fileSize)}
                </Text>
              </View>

              {uploading && (
                <View style={styles.uploadProgress}>
                  <ProgressBar progress={uploadProgress} color={COLORS.primary} />
                  <Text variant="labelSmall" style={styles.uploadProgressText}>
                    {Math.round(uploadProgress * 100)}%
                  </Text>
                </View>
              )}

              <Button
                mode="contained"
                onPress={handleSendMedia}
                disabled={uploading}
                loading={uploading}
                style={styles.sendMediaButton}
              >
                Invia {selectedMedia.type === 'image' ? 'Immagine' : selectedMedia.type === 'video' ? 'Video' : 'File'}
              </Button>
            </View>
          </Surface>
        )}

        {/* Normal Input */}
        {!recording && !selectedMedia && (
          <Surface style={styles.inputContainer} elevation={4}>
            <View style={styles.inputRow}>
              <IconButton
                icon="plus"
                size={24}
                iconColor={COLORS.primary}
                onPress={() => setShowMediaMenu(!showMediaMenu)}
                disabled={!isConnected}
              />
              <TextInput
                value={message}
                onChangeText={handleTextChange}
                placeholder={isConnected ? "Scrivi un messaggio..." : "Connessione..."}
                mode="outlined"
                style={styles.input}
                multiline
                maxLength={1000}
                disabled={!isConnected}
              />
              <IconButton
                icon="send"
                size={24}
                iconColor={isConnected && message.trim() ? COLORS.primary : COLORS.textSecondary}
                onPress={handleSend}
                disabled={!isConnected || !message.trim()}
              />
            </View>
          </Surface>
        )}
      </KeyboardAvoidingView>

      {/* Media Menu Modal */}
      <Portal>
        <Modal
          visible={showMediaMenu}
          onDismiss={() => setShowMediaMenu(false)}
          contentContainerStyle={styles.mediaMenuModal}
        >
          <Surface style={styles.mediaMenuSurface}>
            <List.Item
              title="Foto dalla Galleria"
              left={() => <List.Icon icon="image" color={COLORS.primary} />}
              onPress={handlePickImage}
            />
            <List.Item
              title="Scatta Foto"
              left={() => <List.Icon icon="camera" color={COLORS.primary} />}
              onPress={handleTakePhoto}
            />
            <List.Item
              title="Video"
              left={() => <List.Icon icon="video" color={COLORS.primary} />}
              onPress={handlePickVideo}
            />
            <List.Item
              title="File"
              left={() => <List.Icon icon="file" color={COLORS.primary} />}
              onPress={handlePickDocument}
            />
            <List.Item
              title="Messaggio Vocale"
              left={() => <List.Icon icon="microphone" color={COLORS.error} />}
              onPress={handleStartRecording}
            />
          </Surface>
        </Modal>
      </Portal>

      <Portal>
        <Modal
          visible={showUsers}
          onDismiss={() => setShowUsers(false)}
          contentContainerStyle={styles.modal}
        >
          <Surface style={styles.modalSurface}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge">Utenti Online</Text>
              <IconButton icon="close" onPress={() => setShowUsers(false)} />
            </View>

            <FlatList
              data={onlineUsers}
              keyExtractor={(item, index) => `${item}-${index}`}
              renderItem={({ item }) => (
                <List.Item
                  title={item}
                  left={() => (
                    <MaterialCommunityIcons
                      name="circle"
                      size={12}
                      color={COLORS.success}
                      style={styles.onlineIndicator}
                    />
                  )}
                  right={() =>
                    item === username ? (
                      <Text style={styles.youText}>(tu)</Text>
                    ) : null
                  }
                />
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nessun utente online</Text>
              }
            />
          </Surface>
        </Modal>
      </Portal>

      <HistoryMenu
        visible={showHistory}
        onDismiss={() => setShowHistory(false)}
        onExportJSON={handleExportJSON}
        onExportText={handleExportText}
        onClearHistory={handleClearHistory}
        messageCount={messages.length}
        storageStats={storageStats}
      />

      {error && (
        <Surface style={styles.errorBanner} elevation={4}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="white" />
          <Text style={styles.errorText}>{error}</Text>
        </Surface>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },
  connectionIcon: {
    marginRight: -8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
  },
  historyBadge: {
    position: 'absolute',
    top: 8,
    right: 60,
    backgroundColor: '#4caf50',
  },
  messagesList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inputContainer: {
    padding: 8,
    backgroundColor: 'white',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    flex: 1,
    maxHeight: 100,
  },
  // Recording styles
  recordingContainer: {
    padding: 12,
    backgroundColor: '#ffebee',
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  recordingPulse: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#d32f2f',
    top: 4,
    right: 4,
  },
  recordingInfo: {
    flex: 1,
  },
  recordingText: {
    fontWeight: '600',
    color: COLORS.text,
  },
  recordingDuration: {
    color: COLORS.textSecondary,
  },
  // Media preview styles
  mediaPreviewContainer: {
    padding: 12,
    backgroundColor: '#e3f2fd',
  },
  mediaPreviewContent: {
    gap: 8,
  },
  mediaPreviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mediaPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  mediaPreviewInfo: {
    gap: 4,
  },
  mediaPreviewSize: {
    color: COLORS.textSecondary,
  },
  uploadProgress: {
    gap: 4,
  },
  uploadProgressText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  sendMediaButton: {
    marginTop: 8,
  },
  // Media menu styles
  mediaMenuModal: {
    padding: 20,
    justifyContent: 'flex-end',
    margin: 0,
  },
  mediaMenuSurface: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modal: {
    padding: 20,
  },
  modalSurface: {
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  onlineIndicator: {
    marginTop: 16,
    marginLeft: 16,
  },
  youText: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: COLORS.textSecondary,
  },
  errorBanner: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    color: 'white',
    flex: 1,
  },
});
