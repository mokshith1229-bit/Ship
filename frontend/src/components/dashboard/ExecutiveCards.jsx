import React, { useEffect, useState } from 'react';
import { MdStar, MdFolder, MdListAlt, MdWarning, MdArrowDropUp, MdArrowDropDown } from 'react-icons/md';
import { useSocket } from '../../context/SocketContext';

const CountUp = ({ to, delay = 0, isDecimal = false }) => {
  const [count, setCount] = useState(0);
  const prevToRef = React.useRef(0);
  
  useEffect(() => {
    let startTime;
    const duration = 1500;
    let animationFrame;
    const startValue = prevToRef.current;
    const endValue = to;
    
    // If it's already at the target, no need to animate
    if (startValue === endValue && count === endValue) return;
    
    const animate = (time) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(startValue + (endValue - startValue) * easeProgress);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        prevToRef.current = endValue;
      }
    };
    
    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay * 1000);
    
    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [to, delay]);

  return <>{isDecimal ? count.toFixed(2) : Math.floor(count).toLocaleString()}</>;
};

const ExecutiveCards = () => {
  const [data, setData] = useState(null);
  const socket = useSocket();

  const fetchKPIs = () => {
    import('../../services/dashboard.service').then(({ dashboardService }) => {
      dashboardService.getExecutiveKPIs().then(setData).catch(console.error);
    });
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      // Re-fetch the latest metrics when an update occurs
      fetchKPIs();
    };

    socket.on('DASHBOARD_METRICS_UPDATED', handleUpdate);
    return () => {
      socket.off('DASHBOARD_METRICS_UPDATED', handleUpdate);
    };
  }, [socket]);

  if (!data) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      
      {/* Perfect 10 Ratings */}
      <div className="bg-white border border-gray-300 shadow-sm rounded flex flex-col p-3 relative h-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <MdStar className="text-yellow-400 text-lg" />
          <h3 className="text-gray-700 font-bold text-xs uppercase tracking-tight text-center leading-tight">Perfect 10 Ratings</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center mt-2">
          <span className="text-3xl font-bold text-green-600"><CountUp to={data.perfect10Percentage} isDecimal={true} />%</span>
        </div>
        <div className="text-[10px] text-gray-500 font-medium text-center mt-2 border-t pt-1">
          Percentage of 10s
        </div>
      </div>

      {/* Total Projects */}
      <div className="bg-white border border-gray-300 shadow-sm rounded flex flex-col p-3 relative h-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <MdFolder className="text-yellow-500 text-lg" />
          <h3 className="text-gray-700 font-bold text-xs uppercase tracking-tight">Total Projects</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-gray-800"><CountUp to={data.totalProjects} delay={0.1} /></span>
        </div>
        <div className="text-[10px] text-transparent font-medium text-center mt-2 border-t pt-1">
          -
        </div>
      </div>

      {/* Images Evaluated */}
      <div className="bg-white border border-gray-300 shadow-sm rounded flex flex-col p-3 relative h-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <MdListAlt className="text-pink-400 text-lg" />
          <h3 className="text-gray-700 font-bold text-[10px] uppercase tracking-tight text-center">Images Evaluated</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-blue-500">
            {data.ratedInspections >= 1000 ? (
              <><CountUp to={data.ratedInspections / 1000} isDecimal={true} delay={0.2} />K</>
            ) : (
              <CountUp to={data.ratedInspections} delay={0.2} />
            )}
          </span>
        </div>
        <div className="text-[10px] text-gray-500 font-medium text-center mt-2 border-t pt-1">
          By All Users
        </div>
      </div>

      {/* Critical Observations */}
      <div className="bg-white border border-gray-300 shadow-sm rounded flex flex-col p-3 relative h-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <MdWarning className="text-orange-400 text-lg" />
          <h3 className="text-gray-700 font-bold text-[10px] uppercase tracking-tight text-center">Critical Observations</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-red-500"><CountUp to={data.criticalObservations} delay={0.3} /></span>
        </div>
        <div className="text-[10px] text-gray-500 font-medium text-center mt-2 border-t pt-1">
          Ratings {'<='} 5
        </div>
      </div>

      {/* Green Rated Projects */}
      <div className="bg-white border border-gray-300 shadow-sm rounded flex flex-col p-3 relative h-full">
        <div className="flex items-center gap-2 mb-2 justify-center">
          <h3 className="text-gray-700 font-bold text-xs uppercase tracking-tight text-center">Green Rated<br/>Projects</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center mt-1">
          <span className="text-3xl font-bold text-green-600"><CountUp to={data.greenRatedProjects} delay={0.4} /></span>
        </div>
        <div className="text-[10px] text-gray-500 font-medium text-center mt-2 border-t pt-1">
          Projects {'(Avg >= 7)'}
        </div>
      </div>

    </div>
  );
};

export default ExecutiveCards;
