import React from 'react';
import { Users, Circle } from 'lucide-react';

const UserList = ({ users, currentUsername }) => {
  return (
    <div className="w-64 bg-white rounded-lg shadow-lg p-4 hidden lg:block">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-800">
          Utenti Online ({users.length})
        </h2>
      </div>
      
      <ul className="space-y-2 max-h-96 overflow-y-auto">
        {users.map((user) => (
          <li 
            key={user} 
            className={`flex items-center gap-2 p-2 rounded transition-colors ${
              user === currentUsername 
                ? 'bg-purple-50 border border-purple-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <Circle className="w-2 h-2 fill-green-500 text-green-500 flex-shrink-0" />
            <span className={`truncate ${user === currentUsername ? 'font-semibold' : ''}`}>
              {user} {user === currentUsername && '(tu)'}
            </span>
          </li>
        ))}
      </ul>
      
      {users.length === 0 && (
        <p className="text-gray-500 text-sm text-center mt-4">
          Nessun utente online
        </p>
      )}
    </div>
  );
};

export default UserList;