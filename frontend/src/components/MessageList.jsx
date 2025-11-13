import React, { useEffect, useRef } from 'react';
import MediaMessage from './MediaMessage';

const MessageList = ({ messages, currentUsername, typingUsers }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const filteredTypingUsers = Array.from(typingUsers).filter(u => u !== currentUsername);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fadeIn">
            <MediaMessage message={msg} currentUsername={currentUsername} />
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {filteredTypingUsers.length > 0 && (
        <div className="px-4 py-2 text-sm text-gray-500 italic border-t">
          <span className="inline-flex items-center">
            <span className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
            {filteredTypingUsers.join(', ')}
            {filteredTypingUsers.length === 1 ? ' sta' : ' stanno'} scrivendo
          </span>
        </div>
      )}
    </div>
  );
};

export default MessageList;