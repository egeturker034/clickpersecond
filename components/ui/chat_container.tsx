import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  message: string;
  username: string;
  profilePicture: string;
  level: number;
  isAdmin?: boolean;
}

interface ChatContainerProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onFocus: () => void;
  onBlur: () => void;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ messages, onSendMessage, onFocus, onBlur }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // don't remove it: we can't access the focus state bcs of the shitty codebase
    inputRef.current?.focus();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
  };

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start space-x-2"
          >
            <img 
              src={msg.profilePicture || "https://t3.ftcdn.net/jpg/06/33/54/78/360_F_633547842_AugYzexTpMJ9z1YcpTKUBoqBF0CUCk10.jpg"} 
              alt={msg.username} 
              className="w-8 h-8 rounded-full object-cover"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className={`font-semibold ${msg.isAdmin ? 'text-red-900 font-bold' : ''}`}>{msg.username}</span>
                {msg.isAdmin ? (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">ADMIN</span>
                ) : (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Lvl {msg.level}</span>
                )}
              </div>
              <p className="text-sm text-gray-700">{msg.message}</p>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={handleInputChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Type a message or /command..."
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>
    </div>
  );
};

export default ChatContainer;
