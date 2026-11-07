import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';
import './UserLayout.css';

export default function UserLayout({ children }) {
  const location = useLocation();
  const [online, setOnline] = useState(() => navigator.onLine);
  const [showConnected, setShowConnected] = useState(false);
  const wasOffline = useRef(!navigator.onLine);
  useEffect(() => {
    let timeout;
    const check = () => {
      const current = navigator.onLine;
      setOnline(current);
      if (current && wasOffline.current) {
        setShowConnected(true);
        clearTimeout(timeout);
        timeout = setTimeout(() => setShowConnected(false), 3500);
      }
      if (!current) { setShowConnected(false); clearTimeout(timeout); }
      wasOffline.current = !current;
    };
    window.addEventListener('online', check);
    window.addEventListener('offline', check);
    return () => { clearTimeout(timeout); window.removeEventListener('online', check); window.removeEventListener('offline', check); };
  }, []);
  return (
    <div className="user-layout huego-mobile-layout">
      <div key={location.pathname} className="huego-route-transition">{children}</div>
      {(!online || showConnected) && (
        <div className={`huego-connectivity ${online ? 'is-back' : 'is-offline'}`} role="status" aria-live="polite">
          <span aria-hidden="true">{online ? '✓' : '◌'}</span>
          <span>{online ? 'Đã kết nối Internet' : 'Đang sử dụng dữ liệu Offline'}</span>
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
}
