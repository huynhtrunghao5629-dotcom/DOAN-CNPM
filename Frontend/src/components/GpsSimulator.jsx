import React, { useEffect, useRef, useState } from 'react';
import { usePoiStore } from '../stores/poiStore';
import '../pages/User/MapPage.css';

// Demo offline/kiểm thử: không dùng để thay thế định vị thật.
export default function GpsSimulator({ onSimulate, onDisable }) {
  const pois = usePoiStore(s => s.pois);
  const [selectedId, setSelectedId] = useState('');
  const [open, setOpen] = useState(false);
  const pickerRef = useRef(null);
  const validPois = pois.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const selectedPoi = validPois.find(p => String(p.id) === selectedId);

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) setOpen(false);
    };
    const onEscape = (event) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const simulateSelected = () => {
    if (!selectedPoi) return;
    onSimulate({lat:selectedPoi.lat,lng:selectedPoi.lng,accuracy:5,source:'simulator',timestamp:Date.now()});
    setOpen(false);
  };

  return (
    <div className="hue-simulator">
      <div className="hue-simulator-heading">
        <span className="hue-simulator-icon" aria-hidden="true">🧪</span>
        <div><strong>GPS giả lập</strong><p>Chế độ kiểm thử tại nhà</p></div>
        <span className="hue-simulator-badge">DEMO</span>
      </div>
      <label className="hue-map-field-label" id="hue-demo-poi-label">Chọn di tích muốn đến</label>
      <div className="hue-poi-picker" ref={pickerRef}>
        <button type="button" className="hue-poi-picker-trigger" aria-expanded={open}
          aria-controls="hue-poi-picker-options" aria-labelledby="hue-demo-poi-label hue-demo-poi-value"
          onClick={() => setOpen(v => !v)}>
          <span id="hue-demo-poi-value" className="hue-poi-picker-label">{selectedPoi?.name || 'Chọn một di tích...'}</span>
          <span className="hue-poi-picker-arrow" aria-hidden="true">{open ? '⌃' : '⌄'}</span>
        </button>
        {open && (
          <ul id="hue-poi-picker-options" className="hue-poi-picker-list" aria-label="Danh sách di tích">
            {validPois.length ? validPois.map(p => (
              <li key={p.id}>
                <button type="button" className="hue-poi-picker-option"
                  aria-selected={selectedId === String(p.id)}
                  onClick={() => {setSelectedId(String(p.id));setOpen(false);}}>{p.name}</button>
              </li>
            )) : <li className="hue-poi-picker-empty">Đang tải danh sách di tích...</li>}
          </ul>
        )}
      </div>
      <div className="hue-simulator-actions">
        <button type="button" className="hue-btn hue-btn-primary" onClick={simulateSelected} disabled={!selectedPoi}>📍 Mô phỏng vị trí</button>
        <button type="button" className="hue-btn hue-btn-outline" onClick={onDisable}>Tắt</button>
      </div>
      <p className="hue-simulator-tip">GPS giả lập chỉ dùng để kiểm thử Geofence và thuyết minh.</p>
    </div>
  );
}
