import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { COLORS } from '../config/constants';

export default function MessageItem({ message, currentUsername }) {
  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <Surface style={styles.systemMessage} elevation={0}>
          <Text variant="bodySmall" style={styles.systemText}>
            {message.message}
          </Text>
        </Surface>
      </View>
    );
  }

  const isOwn = message.isOwn || message.username === currentUsername;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={[styles.container, isOwn && styles.ownContainer]}>
      <Surface
        style={[
          styles.bubble,
          isOwn ? styles.ownBubble : styles.otherBubble
        ]}
        elevation={1}
      >
        {!isOwn && (
          <Text variant="labelSmall" style={styles.username}>
            {message.username}
          </Text>
        )}
        <Text
          variant="bodyMedium"
          style={[styles.messageText, isOwn && styles.ownText]}
        >
          {message.message}
        </Text>
        <View style={styles.timestampContainer}>
          {message.encrypted && (
            <Text style={[styles.encrypted, isOwn && styles.encryptedOwn]}>🔐</Text>
          )}
          <Text
            variant="labelSmall"
            style={[styles.timestamp, isOwn && styles.ownTimestamp]}
          >
            {formatTime(message.timestamp)}
          </Text>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  username: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    color: COLORS.text,
  },
  ownText: {
    color: 'white',
  },
  timestampContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  encrypted: {
    fontSize: 10,
  },
  encryptedOwn: {
    opacity: 0.8,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessage: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  systemText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
