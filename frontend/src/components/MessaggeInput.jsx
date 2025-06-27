import React, { useState, useRef } from 'react';
import { Send } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping, isConnected }) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !isConnected) return;

    onSendMessage(trimmedMessage);
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

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={handleChange}
          placeholder={isConnected ? "Scrivi un messaggio..." : "Connessione in corso..."}
          className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-full focus:border-purple-500 focus:outline-none transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
          disabled={!isConnected}
          maxLength={1000}
        />
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