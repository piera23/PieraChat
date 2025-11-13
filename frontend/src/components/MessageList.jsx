import React, { useEffect, useRef } from 'react';

const MessageList = ({ messages, currentUsername, typingUsers }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const filteredTypingUsers = Array.from(typingUsers).filter(u => u !== currentUsername);

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="animate-fadeIn">
            {msg.type === 'system' ? (
              <div className="text-center my-2">
                <span className="inline-block bg-gray-200 text-gray-600 text-sm px-3 py-1 rounded-full">
                  {msg.message}
                </span>
              </div>
            ) : (
              <div className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${msg.isOwn ? 'order-2' : ''}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl break-words ${
                      msg.isOwn
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {msg.message}
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${msg.isOwn ? 'text-right' : ''}`}>
                    {msg.username} • {formatTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            )}
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