import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createCurrentPin = () => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="rgba(34,197,94,0.2)">
        <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="12" cy="12" r="5" fill="#22c55e" stroke="white" stroke-width="2"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => { 
    if (center) map.setView(center, 16, { animate: true, duration: 0.5 }); 
  }, [center, map]);
  return null;
};

const InspectionMap = ({ task, mode = 'compact' }) => {
  const [center, setCenter] = useState(null);

  useEffect(() => {
    if (task?.metadata?.latitude && task?.metadata?.longitude) {
      setCenter([task.metadata.latitude, task.metadata.longitude]);
    }
  }, [task]);

  if (!center) {
    return (
      <div className="w-48 h-32 bg-black/40 backdrop-blur-md rounded border border-white/10 flex items-center justify-center text-white/50 text-xs text-center p-2">
        Location map unavailable for this task
      </div>
    );
  }

  const isCompact = mode === 'compact';

  return (
    <div className={`overflow-hidden rounded border border-white/20 shadow-lg ${isCompact ? 'w-64 h-48 opacity-90 hover:opacity-100 transition-opacity' : 'w-full h-full'}`}>
      <MapContainer center={center} zoom={16} zoomControl={!isCompact} className="w-full h-full">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        />
        <Marker position={center} icon={createCurrentPin()} />
        <RecenterMap center={center} />
      </MapContainer>
    </div>
  );
};

export default InspectionMap;
