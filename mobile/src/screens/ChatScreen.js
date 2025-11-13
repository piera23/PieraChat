import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Appbar, TextInput, IconButton, Text, Surface, Badge, Portal, Modal, List } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useMobilePieraServer } from '../hooks/useMobilePieraServer';
import MessageItem from '../components/MessageItem';
import TypingIndicator from '../components/TypingIndicator';
import HistoryMenu from '../components/HistoryMenu';
import { COLORS, CONNECTION_STATES } from '../config/constants';

export default function ChatScreen({ route, navigation }) {
  const { username } = route.params;
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [storageStats, setStorageStats] = useState(null);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);

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

        <Surface style={styles.inputContainer} elevation={4}>
          <TextInput
            value={message}
            onChangeText={handleTextChange}
            placeholder={isConnected ? "Scrivi un messaggio..." : "Connessione..."}
            mode="outlined"
            style={styles.input}
            multiline
            maxLength={1000}
            disabled={!isConnected}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSend}
                disabled={!isConnected || !message.trim()}
                color={isConnected && message.trim() ? COLORS.primary : COLORS.textSecondary}
              />
            }
          />
        </Surface>
      </KeyboardAvoidingView>

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
    padding: 12,
    backgroundColor: 'white',
  },
  input: {
    maxHeight: 100,
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
