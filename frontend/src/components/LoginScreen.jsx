import React, { useState } from 'react';
import { MessageCircle } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
      setError('Inserisci un nome utente');
      return;
    }
    
    if (trimmedUsername.length < 2) {
      setError('Il nome utente deve avere almeno 2 caratteri');
      return;
    }
    
    if (trimmedUsername.length > 20) {
      setError('Il nome utente non può superare i 20 caratteri');
      return;
    }
    
    onLogin(trimmedUsername);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all hover:scale-105">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-full">
            <MessageCircle className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Chat Room WebSocket
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Entra nella chat con il tuo nome utente
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Il tuo nome utente"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none transition-colors"
              maxLength={20}
              autoFocus
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm animate-shake">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          >
            Entra nella Chat
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          Connettiti con amici in tempo reale
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;