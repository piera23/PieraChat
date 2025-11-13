/**
 * MediaMessage Component
 * Renders different message types: text, image, video, audio, file, contact, event
 */

import React, { useState } from 'react';
import { Download, FileText, User, Calendar, Image as ImageIcon, Video, Music, File } from 'lucide-react';
import { formatFileSize, formatDuration, getFileIcon } from '../utils/mediaUpload';

/**
 * Main MediaMessage wrapper - chooses which component to render
 */
export default function MediaMessage({ message, currentUsername }) {
  const isOwn = message.username === currentUsername;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[70%] ${
          isOwn ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : 'bg-white text-gray-800'
        } rounded-2xl shadow-md overflow-hidden`}
      >
        {/* Username header (for others' messages) */}
        {!isOwn && message.type !== 'system' && (
          <div className="px-4 pt-2 pb-1">
            <p className="text-xs font-semibold text-gray-600">{message.username}</p>
          </div>
        )}

        {/* Message content based on type */}
        <div className="px-4 py-2">
          {renderMessageContent(message, isOwn)}
        </div>

        {/* Timestamp footer */}
        <div className={`px-4 pb-2 text-xs ${isOwn ? 'text-blue-100' : 'text-gray-400'}`}>
          {new Date(message.timestamp).toLocaleTimeString('it-IT', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Render message content based on type
 */
function renderMessageContent(message, isOwn) {
  switch (message.type) {
    case 'text':
    case 'message':
      return <TextMessage message={message} />;
    case 'image':
      return <ImageMessage message={message} isOwn={isOwn} />;
    case 'video':
      return <VideoMessage message={message} isOwn={isOwn} />;
    case 'audio':
      return <AudioMessage message={message} isOwn={isOwn} />;
    case 'file':
      return <FileMessage message={message} isOwn={isOwn} />;
    case 'contact':
      return <ContactMessage message={message} isOwn={isOwn} />;
    case 'event':
      return <EventMessage message={message} isOwn={isOwn} />;
    case 'system':
      return <SystemMessage message={message} />;
    default:
      return <TextMessage message={message} />;
  }
}

/**
 * Text message
 */
function TextMessage({ message }) {
  return <p className="break-words whitespace-pre-wrap">{message.message}</p>;
}

/**
 * System message
 */
function SystemMessage({ message }) {
  return (
    <div className="flex justify-center my-2">
      <div className="bg-gray-200 text-gray-600 px-4 py-1 rounded-full text-sm">
        {message.message}
      </div>
    </div>
  );
}

/**
 * Image message
 */
function ImageMessage({ message, isOwn }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { media } = message;

  const imageUrl = media.dataUrl || media.downloadUrl || media.localUri;

  return (
    <div className="space-y-2">
      <div
        className="cursor-pointer rounded-lg overflow-hidden"
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={imageUrl}
          alt={media.fileName}
          className="max-w-sm w-full h-auto object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </div>

      <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
        <ImageIcon className="inline w-3 h-3 mr-1" />
        {media.fileName} • {formatFileSize(media.fileSize)}
      </p>

      {/* Lightbox modal */}
      {lightboxOpen && (
        <ImageLightbox
          imageUrl={imageUrl}
          fileName={media.fileName}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
}

/**
 * Video message
 */
function VideoMessage({ message, isOwn }) {
  const { media } = message;
  const videoUrl = media.dataUrl || media.downloadUrl || media.localUri;

  return (
    <div className="space-y-2">
      <video
        controls
        poster={media.thumbnail}
        className="max-w-sm w-full rounded-lg"
        preload="metadata"
      >
        <source src={videoUrl} type={media.mimeType || 'video/mp4'} />
        Your browser does not support video playback.
      </video>

      <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
        <Video className="inline w-3 h-3 mr-1" />
        {media.fileName} • {formatFileSize(media.fileSize)}
        {media.duration && ` • ${formatDuration(media.duration)}`}
      </p>
    </div>
  );
}

/**
 * Audio message (voice message)
 */
function AudioMessage({ message, isOwn }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = React.useRef(null);
  const { media } = message;

  const audioUrl = media.dataUrl || media.downloadUrl || media.localUri;

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (playing) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setPlaying(!playing);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="space-y-2">
      <div className={`flex items-center gap-3 p-3 rounded-lg ${isOwn ? 'bg-blue-600' : 'bg-gray-100'}`}>
        <button
          onClick={handlePlayPause}
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isOwn ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
          } hover:opacity-80 transition-opacity`}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="flex-1">
          <div className={`flex items-center gap-2 ${isOwn ? 'text-white' : 'text-gray-700'}`}>
            <Music className="w-4 h-4" />
            <span className="text-sm font-medium">Messaggio vocale</span>
          </div>
          <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
            {formatDuration(currentTime)} / {formatDuration(media.duration || 0)}
          </p>
        </div>

        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          preload="metadata"
        />
      </div>
    </div>
  );
}

/**
 * File message
 */
function FileMessage({ message, isOwn }) {
  const [downloading, setDownloading] = useState(false);
  const { media } = message;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = media.dataUrl || media.downloadUrl;
      const a = document.createElement('a');
      a.href = url;
      a.download = media.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Errore durante il download del file');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg ${
        isOwn ? 'bg-blue-600' : 'bg-gray-100'
      }`}
    >
      <div className="text-3xl">{getFileIcon(media.mimeType)}</div>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isOwn ? 'text-white' : 'text-gray-800'}`}>
          {media.fileName}
        </p>
        <p className={`text-xs ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
          {formatFileSize(media.fileSize)}
        </p>
      </div>

      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`p-2 rounded-full ${
          isOwn
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        } transition-colors disabled:opacity-50`}
        title="Scarica file"
      >
        {downloading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <Download className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}

/**
 * Contact message
 */
function ContactMessage({ message, isOwn }) {
  const { contact } = message;

  const handleSaveContact = () => {
    const blob = new Blob([contact.vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contact.name}.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-3 rounded-lg ${isOwn ? 'bg-blue-600' : 'bg-blue-50'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
          isOwn ? 'bg-white' : 'bg-blue-200'
        }`}>
          👤
        </div>

        <div className="flex-1">
          <p className={`font-semibold ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {contact.name}
          </p>
          {contact.phone && (
            <p className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              📞 {contact.phone}
            </p>
          )}
          {contact.email && (
            <p className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              ✉️ {contact.email}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleSaveContact}
        className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isOwn
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-blue-500 text-white hover:bg-blue-600'
        }`}
      >
        <User className="inline w-4 h-4 mr-2" />
        Salva Contatto
      </button>
    </div>
  );
}

/**
 * Event message (calendar event)
 */
function EventMessage({ message, isOwn }) {
  const { event } = message;

  const handleAddToCalendar = () => {
    const blob = new Blob([event.ical], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-3 rounded-lg ${isOwn ? 'bg-blue-600' : 'bg-purple-50'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
          isOwn ? 'bg-white' : 'bg-purple-200'
        }`}>
          📅
        </div>

        <div className="flex-1">
          <p className={`font-semibold ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {event.title}
          </p>
          <p className={`text-sm mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
            🕐 {new Date(event.startDate).toLocaleString('it-IT')}
          </p>
          {event.endDate && event.endDate !== event.startDate && (
            <p className={`text-sm ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              {new Date(event.endDate).toLocaleString('it-IT')}
            </p>
          )}
          {event.location && (
            <p className={`text-sm mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-600'}`}>
              📍 {event.location}
            </p>
          )}
          {event.description && (
            <p className={`text-sm mt-2 ${isOwn ? 'text-blue-50' : 'text-gray-700'}`}>
              {event.description}
            </p>
          )}
        </div>
      </div>

      <button
        onClick={handleAddToCalendar}
        className={`mt-3 w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isOwn
            ? 'bg-white text-blue-600 hover:bg-blue-50'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        }`}
      >
        <Calendar className="inline w-4 h-4 mr-2" />
        Aggiungi al Calendario
      </button>
    </div>
  );
}

/**
 * Image Lightbox Modal
 */
function ImageLightbox({ imageUrl, fileName, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
        >
          ✕
        </button>

        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-[90vh] object-contain"
        />

        <div className="absolute bottom-4 left-4 right-4 text-white bg-black bg-opacity-50 p-3 rounded-lg">
          <p className="text-sm">{fileName}</p>
        </div>
      </div>
    </div>
  );
}
