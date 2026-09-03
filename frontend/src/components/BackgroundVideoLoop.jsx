import React, { useState, useEffect, useRef } from 'react';

const videos = [
  '/login-videos/1.mp4',
  '/login-videos/2.mp4',
  '/login-videos/3.mp4',
  '/login-videos/4.mp4'
];

const BackgroundVideoLoop = () => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRef = useRef(null);

  const handleVideoEnd = () => {
    setCurrentVideoIndex((prevIndex) => (prevIndex + 1) % videos.length);
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Video autoplay failed:", error);
        });
      }
    }
  }, [currentVideoIndex]);

  return (
    <div className="fixed inset-0 w-full h-full bg-gray-900 z-0 overflow-hidden">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
        onEnded={handleVideoEnd}
      >
        <source src={videos[currentVideoIndex]} type="video/mp4" />
      </video>
      
      {/* Dark overlay to make text readable */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/80 via-gray-900/70 to-black/80 opacity-90" />
    </div>
  );
};

export default BackgroundVideoLoop;
