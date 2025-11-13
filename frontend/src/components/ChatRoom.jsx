import React, { useState } from 'react';
import { Wifi, WifiOff, Menu, X } from 'lucide-react';
import LoginScreen from './LoginScreen';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import UserList from './UserList';
import { usePieraServer } from '../hooks/usePieraServer';
import { CONNECTION_STATES } from '../utils/constants';

const ChatRoom = () => {
  const [username, setUsername] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const {
    connectionState,
    messages,
    onlineUsers,
    typingUsers,
    error,
    sendMessage,
    sendTyping,
    isConnected
  } = usePieraServer(username);

  const handleLogin = (newUsername) => {
    setUsername(newUsername);
  };

  if (!username) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Chat Room</h1>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Connesso</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">
                    {connectionState === CONNECTION_STATES.CONNECTING 
                      ? 'Connessione...' 
                      : 'Disconnesso'}
                  </span>
                </>
              )}
            </div>
            
            <span className="font-medium hidden sm:inline">{username}</span>
            
            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 container mx-auto p-4 flex gap-4 overflow-hidden relative">
        {/* Chat area */}
        <div className="flex-1 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden">
          <MessageList 
            messages={messages}
            currentUsername={username}
            typingUsers={typingUsers}
          />
          <MessageInput 
            onSendMessage={sendMessage}
            onTyping={sendTyping}
            isConnected={isConnected}
          />
        </div>

        {/* Desktop users sidebar */}
        <UserList 
          users={onlineUsers}
          currentUsername={username}
        />

        {/* Mobile users sidebar */}
        {showMobileMenu && (
          <div className="lg:hidden absolute inset-0 bg-black/50 z-20" onClick={() => setShowMobileMenu(false)}>
            <div className="absolute right-0 top-0 h-full w-64 bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="p-4">
                <UserList 
                  users={onlineUsers}
                  currentUsername={username}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-slideIn">
          {error}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;