import React from 'react';
import { usePoiStore } from '../stores/poiStore';

export default function GpsSimulator() {
  const { pois, setActivePoi } = usePoiStore();

  return (
    <div style={{
      position: 'absolute',
      top: 14,
      left: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      padding: '10px 14px',
      borderRadius: 10,
      boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 6
    }}>
      <span style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>
        🚶 Mô phỏng GPS du khách:
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {pois.map(poi => (
          <button
            key={poi.id}
            onClick={() => setActivePoi(poi)}
            style={{
              fontSize: 11,
              padding: '5px 10px',
              backgroundColor: '#f5f5f5',
              border: '1px solid #ccc',
              borderRadius: 6,
              cursor: 'pointer'
            }}>
            Vào {poi.name.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}