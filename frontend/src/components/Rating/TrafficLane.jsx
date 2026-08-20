import React, { useMemo, useState, useEffect } from 'react';
import { FaCarSide, FaMotorcycle, FaTruck } from 'react-icons/fa';
import { motion } from 'framer-motion';

const vehiclePool = [
  { type: 'car', icon: FaCarSide, sizeClass: 'text-[24px]' },
  { type: 'bike', icon: FaMotorcycle, sizeClass: 'text-[20px]' },
  { type: 'truck', icon: FaTruck, sizeClass: 'text-[32px]' }
];

const TrafficLane = ({ count = 0, delay = 0, duration = 3.2 }) => {
  // Generate a random sequence that avoids adjacent identical vehicles
  // Length is exactly equal to the count denoted by the box.
  const sequence = useMemo(() => {
    if (count <= 0) return [];
    
    const seq = [];
    let lastType = null;
    
    for (let i = 0; i < count; i++) {
      let choices = vehiclePool;
      if (lastType) {
        choices = vehiclePool.filter(v => v.type !== lastType);
      }
      
      const choice = choices[Math.floor(Math.random() * choices.length)];
      seq.push({ ...choice, keyId: `v-${i}` });
      lastType = choice.type;
    }
    
    return seq;
  }, [count]);

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    // Start the animation when it's this box's turn in the sequence
    const timeout = setTimeout(() => {
      setHasStarted(true);
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [delay]);

  if (sequence.length === 0) return null;

  return (
    <div className="absolute bottom-[2px] left-0 right-0 h-12 z-10 pointer-events-none overflow-hidden flex items-end">
      {hasStarted && (
        <motion.div 
          initial={{ x: "-100%", left: "0%" }}
          animate={{ x: "0%", left: "100%" }}
          transition={{ duration: duration, ease: "linear" }}
          className="absolute flex items-end w-max pb-1.5 text-gray-800 h-full"
        >
          {sequence.map((vehicle, i) => {
            const Icon = vehicle.icon;
            return (
              <div key={`${vehicle.keyId}-${i}`} className="flex items-end justify-center px-3 shrink-0 h-full">
                <Icon className={`${vehicle.sizeClass} drop-shadow-sm opacity-90`} />
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default TrafficLane;
