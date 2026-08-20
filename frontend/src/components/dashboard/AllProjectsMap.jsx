import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { projectCoordinates } from '../../data/projectCoordinates';
import 'leaflet/dist/leaflet.css';

// Custom Icons with Project Key
const createCustomIcon = (status, projectKey) => {
  const color = '#3B82F6'; // Blue for all pins
  
  const pinSvg = `<svg width="18" height="26" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12zm0 17.5c-3.038 0-5.5-2.462-5.5-5.5s2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z" fill="${color}"/></svg>`;

  const html = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 60px; transform: translateX(-24px); margin-top: -12px;">
      ${pinSvg}
      <span style="font-size: 8px; font-weight: bold; color: #111; margin-top: 1px; text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff; white-space: nowrap;">
        ${projectKey}
      </span>
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-div-icon',
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

const AllProjectsMap = () => {
  const navigate = useNavigate();
  const center = [22.9, 78.9];

  // Dummy logic to assign statuses based on project key length for visual variety
  const getStatus = (key) => {
    if (key.length === 5) return 'Rise';
    if (key.length === 4) return 'Fall';
    return 'Retained';
  };

  return (
    <div className="w-full h-[500px] rounded border border-gray-300 shadow-sm relative z-0 bg-white p-2">
      <div className="absolute bottom-6 right-6 bg-white p-2 border shadow-sm z-[400] rounded text-[10px] font-bold">
        <div className="flex items-center gap-2 mb-1">
          <svg width="12" height="16" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12c0 9 12 24 12 24s12-15 12-24c0-6.627-5.373-12-12-12zm0 17.5c-3.038 0-5.5-2.462-5.5-5.5s2.462-5.5 5.5-5.5 5.5 2.462 5.5 5.5-2.462 5.5-5.5 5.5z" fill="#3B82F6"/></svg> Project Location
        </div>
      </div>
      <MapContainer center={center} zoom={4.5} scrollWheelZoom={false} className="w-full h-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {Object.entries(projectCoordinates).map(([projectKey, data]) => (
          <Marker 
            key={projectKey} 
            position={[data.lat, data.lng]}
            icon={createCustomIcon(getStatus(projectKey), projectKey)}
            eventHandlers={{
              click: () => {
                navigate(`?project=${projectKey}`);
              }
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-center p-1">
                <strong className="text-primary block mb-1">{data.full_name}</strong>
                <span className="text-xs text-gray-500 block">State: {data.state}</span>
                <span className="text-[10px] text-gray-400 mt-1 block">(Click to view dashboard)</span>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AllProjectsMap;
