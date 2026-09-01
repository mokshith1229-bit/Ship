import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '../../context/SocketContext';
import { MdHistory, MdPerson, MdLocationOn } from 'react-icons/md';

const LiveActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleNewActivity = (activity) => {
      setActivities((prev) => {
        const newFeed = [activity, ...prev];
        return newFeed.slice(0, 50); // Keep last 50 activities
      });
    };

    socket.on('NEW_ACTIVITY', handleNewActivity);
    
    // Optional: Fetch initial activities if we have an endpoint, 
    // otherwise it remains empty until an action happens.

    return () => {
      socket.off('NEW_ACTIVITY', handleNewActivity);
    };
  }, [socket]);

  return (
    <div className="bg-white border border-gray-300 rounded shadow-sm p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4 border-b pb-2">
        <MdHistory className="text-gray-500 text-lg" />
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Live Activity Feed</h2>
        <span className="ml-auto relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {activities.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-gray-400 font-medium">
            Waiting for live activity...
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {activities.map((activity) => (
                <motion.div
                  key={activity.id || Math.random().toString()}
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex flex-col gap-1.5"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1">
                      <MdPerson className="text-gray-400" />
                      {activity.user}
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-700 font-medium leading-tight">
                    <span className="text-green-600 font-bold">{activity.action}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 pt-1 border-t border-gray-200">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <MdFolder className="text-gray-400" /> {activity.project}
                    </span>
                    <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1">
                      <MdLocationOn className="text-gray-400" /> {activity.chainage}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveActivityFeed;
