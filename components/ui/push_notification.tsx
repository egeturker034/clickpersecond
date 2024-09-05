import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { X } from 'lucide-react';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: string;
}

interface PushNotificationProps {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

const PushNotification: React.FC<PushNotificationProps> = ({ notifications, removeNotification }) => {
  useEffect(() => {
    notifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, removeNotification]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className={`w-64 mb-2 bg-white shadow-md rounded-md overflow-hidden border-l-4 ${
              notification.type === 'success' ? 'border-green-500' :
              notification.type === 'error' ? 'border-red-500' :
              'border-blue-500'
            }`}
          >
            <div className="p-3 flex items-center">
              <div className="flex-grow pr-2 flex flex-col justify-center">
                <p className="text-sm text-gray-600 font-light leading-snug text-left mb-1">{notification.message}</p>
                <p className="text-xs text-gray-400 text-left">{new Date(notification.timestamp).toLocaleTimeString()}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default PushNotification;
