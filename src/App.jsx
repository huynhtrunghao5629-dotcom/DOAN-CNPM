import React from 'react';
import MapContainer from './components/MapContainer';
import AudioPlayerBar from './components/AudioPlayerBar';
import GpsSimulator from './components/GpsSimulator';

export default function App() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GpsSimulator />
      <MapContainer />
      <AudioPlayerBar />
    </div>
  );
}