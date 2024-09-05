import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { PlayerStats } from '../types';

interface AdminContainerProps {
  onClose: (disguiseInfo?: { isDisguised: boolean; disguisedUsername: string }) => void;
  playerStats: PlayerStats;
  setPlayerStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  isAdmin: boolean;
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>;
}

const AdminContainer: React.FC<AdminContainerProps> = ({
  onClose,
  playerStats,
  setPlayerStats,
  username,
  setUsername,
  isAdmin,
  setIsAdmin,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="absolute top-16 left-4 w-80 bg-white rounded-lg shadow-lg overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg text-gray-500 font-semibold">Panel</h3>
        <motion.button 
          onClick={() => onClose()}
          className="text-gray-400 hover:text-gray-600"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={20} />
        </motion.button>
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center space-x-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <AlertTriangle size={24} />
          <p className="text-sm">
            The admin panel is currently under maintenance. We apologize for any inconvenience.
          </p>
        </div>
        {/* elbet bir gün
        <div>
          <h4 className="text-md font-semibold mb-2">Stats Editor</h4>
          {Object.entries(tempStats).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2 mb-2">
              <label className="text-sm text-gray-600">{key}:</label>
              <input
                type="number"
                name={key}
                value={value}
                onChange={handleStatsChange}
                className="w-full px-2 py-1 border rounded-md"
                disabled={!isEditable}
              />
            </div>
          ))}
        </div>
        <div>
          <h4 className="text-md font-semibold mb-2">Username Editor</h4>
          <input
            type="text"
            value={tempUsername}
            onChange={(e) => setTempUsername(e.target.value)}
            className="w-full px-2 py-1 border rounded-md"
            disabled={!isEditable}
          />
        </div>
        <div>
          <h4 className="text-md font-semibold mb-2">Disguise Mode</h4>
          <button
            onClick={toggleDisguise}
            className={`px-4 py-2 rounded-md ${
              isDisguised ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
            }`}
            disabled={!isEditable}
          >
            {isDisguised ? 'Disable Disguise' : 'Enable Disguise'}
          </button>
        </div>
        <button
          onClick={saveChanges}
          className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          disabled={!isEditable}
        >
          Save Changes
        </button>
        */}
      </div>
    </motion.div>
  );
};

export default AdminContainer;