import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { Surface, Text, Button, IconButton, ProgressBar } from 'react-native-paper';
import { Video } from 'expo-av';
import { COLORS } from '../config/constants';
import { MobileAudioPlayer } from '../utils/audioRecorder';
import { formatFileSize, formatDuration, getFileIcon } from '../utils/mediaPicker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Image Message Component
function ImageMessage({ media, isOwn }) {
  const imageUrl = media.dataUrl || media.downloadUrl || media.uri;
  const maxWidth = SCREEN_WIDTH * 0.6;

  return (
    <View style={styles.mediaContainer}>
      <Image
        source={{ uri: imageUrl }}
        style={[
          styles.image,
          {
            width: maxWidth,
            height: (maxWidth * media.height) / media.width || maxWidth
          }
        ]}
        resizeMode="cover"
      />
      <Text variant="labelSmall" style={[styles.mediaInfo, isOwn && styles.mediaInfoOwn]}>
        {media.fileName} • {formatFileSize(media.fileSize)}
      </Text>
    </View>
  );
}

// Video Message Component
function VideoMessage({ media, isOwn }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoUrl = media.dataUrl || media.downloadUrl || media.uri;
  const maxWidth = SCREEN_WIDTH * 0.6;

  return (
    <View style={styles.mediaContainer}>
      <Video
        ref={videoRef}
        source={{ uri: videoUrl }}
        style={[
          styles.video,
          {
            width: maxWidth,
            height: (maxWidth * 9) / 16 // 16:9 aspect ratio
          }
        ]}
        useNativeControls
        resizeMode="contain"
        onPlaybackStatusUpdate={(status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        }}
      />
      <Text variant="labelSmall" style={[styles.mediaInfo, isOwn && styles.mediaInfoOwn]}>
        🎥 {media.fileName} • {formatFileSize(media.fileSize)}
      </Text>
    </View>
  );
}

// Audio Message Component
function AudioMessage({ media, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(media.duration || 0);
  const audioPlayer = useRef(new MobileAudioPlayer());

  useEffect(() => {
    const audioUrl = media.dataUrl || media.downloadUrl || media.uri;

    const loadAudio = async () => {
      try {
        await audioPlayer.current.loadAudio(audioUrl);
        setDuration(audioPlayer.current.getDuration());
      } catch (error) {
        console.error('Failed to load audio:', error);
      }
    };

    loadAudio();

    // Update position every 100ms while playing
    const interval = setInterval(() => {
      if (audioPlayer.current.getIsPlaying()) {
        setPosition(audioPlayer.current.getPosition());
        setIsPlaying(true);
      } else {
        setIsPlaying(false);
      }
    }, 100);

    return () => {
      clearInterval(interval);
      audioPlayer.current.unloadAudio();
    };
  }, [media]);

  const handlePlayPause = async () => {
    try {
      if (isPlaying) {
        await audioPlayer.current.pause();
      } else {
        await audioPlayer.current.play();
      }
    } catch (error) {
      console.error('Audio playback error:', error);
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  return (
    <View style={styles.audioContainer}>
      <IconButton
        icon={isPlaying ? 'pause' : 'play'}
        size={32}
        iconColor={isOwn ? 'white' : COLORS.primary}
        onPress={handlePlayPause}
        style={styles.audioButton}
      />
      <View style={styles.audioInfo}>
        <View style={styles.audioWaveform}>
          <ProgressBar
            progress={progress}
            color={isOwn ? 'white' : COLORS.primary}
            style={styles.progressBar}
          />
        </View>
        <Text variant="labelSmall" style={[styles.audioDuration, isOwn && styles.mediaInfoOwn]}>
          {formatDuration(isPlaying ? position : duration)}
        </Text>
      </View>
    </View>
  );
}

// File Message Component
function FileMessage({ media, isOwn }) {
  const handleDownload = () => {
    const url = media.downloadUrl || media.uri;
    if (url) {
      Linking.openURL(url);
    }
  };

  return (
    <View style={styles.fileContainer}>
      <View style={styles.fileIconContainer}>
        <Text style={styles.fileIcon}>{getFileIcon(media.mimeType)}</Text>
      </View>
      <View style={styles.fileInfo}>
        <Text variant="bodyMedium" style={[styles.fileName, isOwn && styles.ownText]}>
          {media.fileName}
        </Text>
        <Text variant="labelSmall" style={[styles.fileSize, isOwn && styles.mediaInfoOwn]}>
          {formatFileSize(media.fileSize)}
        </Text>
      </View>
      {!media.downloaded && (
        <IconButton
          icon="download"
          size={20}
          iconColor={isOwn ? 'white' : COLORS.primary}
          onPress={handleDownload}
        />
      )}
    </View>
  );
}

// Contact Message Component
function ContactMessage({ contact, isOwn }) {
  return (
    <View style={styles.contactContainer}>
      <View style={styles.contactIcon}>
        <Text style={styles.contactIconText}>👤</Text>
      </View>
      <View style={styles.contactInfo}>
        <Text variant="bodyMedium" style={[styles.contactName, isOwn && styles.ownText]}>
          {contact.name}
        </Text>
        {contact.phoneNumbers && contact.phoneNumbers.length > 0 && (
          <Text variant="labelSmall" style={[styles.contactDetail, isOwn && styles.mediaInfoOwn]}>
            📞 {contact.phoneNumbers[0]}
          </Text>
        )}
        {contact.emails && contact.emails.length > 0 && (
          <Text variant="labelSmall" style={[styles.contactDetail, isOwn && styles.mediaInfoOwn]}>
            ✉️ {contact.emails[0]}
          </Text>
        )}
      </View>
    </View>
  );
}

// Event Message Component
function EventMessage({ event, isOwn }) {
  const formatEventDate = (date) => {
    return new Date(date).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.eventContainer}>
      <View style={styles.eventIcon}>
        <Text style={styles.eventIconText}>📅</Text>
      </View>
      <View style={styles.eventInfo}>
        <Text variant="bodyMedium" style={[styles.eventTitle, isOwn && styles.ownText]}>
          {event.title}
        </Text>
        {event.description && (
          <Text variant="bodySmall" style={[styles.eventDescription, isOwn && styles.mediaInfoOwn]}>
            {event.description}
          </Text>
        )}
        <Text variant="labelSmall" style={[styles.eventDate, isOwn && styles.mediaInfoOwn]}>
          🕐 {formatEventDate(event.startDate)}
        </Text>
        {event.location && (
          <Text variant="labelSmall" style={[styles.eventLocation, isOwn && styles.mediaInfoOwn]}>
            📍 {event.location}
          </Text>
        )}
      </View>
    </View>
  );
}

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

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return <ImageMessage media={message.media} isOwn={isOwn} />;
      case 'video':
        return <VideoMessage media={message.media} isOwn={isOwn} />;
      case 'audio':
        return <AudioMessage media={message.media} isOwn={isOwn} />;
      case 'file':
        return <FileMessage media={message.media} isOwn={isOwn} />;
      case 'contact':
        return <ContactMessage contact={message.contact} isOwn={isOwn} />;
      case 'event':
        return <EventMessage event={message.event} isOwn={isOwn} />;
      default:
        // Text message
        return (
          <Text
            variant="bodyMedium"
            style={[styles.messageText, isOwn && styles.ownText]}
          >
            {message.message}
          </Text>
        );
    }
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
        {renderMessageContent()}
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
  // Media container styles
  mediaContainer: {
    marginBottom: 4,
  },
  image: {
    borderRadius: 8,
    marginBottom: 4,
  },
  video: {
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#000',
  },
  mediaInfo: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  mediaInfoOwn: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  // Audio message styles
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  audioButton: {
    margin: 0,
  },
  audioInfo: {
    flex: 1,
    marginLeft: 8,
  },
  audioWaveform: {
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  audioDuration: {
    fontSize: 11,
  },
  // File message styles
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileIcon: {
    fontSize: 24,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontWeight: '500',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
  },
  // Contact message styles
  contactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactIconText: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 11,
    marginBottom: 2,
  },
  // Event message styles
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 24,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 12,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 11,
    marginBottom: 2,
  },
  eventLocation: {
    fontSize: 11,
  },
});
