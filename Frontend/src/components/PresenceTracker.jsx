import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'huego_presence_session';
const HEARTBEAT_INTERVAL = 30000;

function getSessionId() {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function PresenceTracker() {
  const { pathname } = useLocation();
  const isVisitorPage = pathname === '/' || pathname === '/home' ||
    pathname === '/map' || pathname.startsWith('/poi/');

  useEffect(() => {
    if (!isVisitorPage) return;
    const sessionId = getSessionId();
    let controller = null;
    let disposed = false;

    async function sendHeartbeat() {
      // The Admin count is server-side. No heartbeat can be recorded offline.
      if (disposed || !navigator.onLine || document.visibilityState !== 'visible' || controller) return;
      const request = new AbortController();
      controller = request;
      try {
        const response = await fetch('/api/v1/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
          signal: request.signal,
        });
        if (!response.ok && navigator.onLine) {
          console.warn('Presence API:', response.status);
        }
      } catch (error) {
        // Ignore interrupted requests and expected network loss.
        if (error.name !== 'AbortError' && navigator.onLine) {
          console.warn('Không gửi được heartbeat:', error);
        }
      } finally {
        if (controller === request) controller = null;
      }
    }

    sendHeartbeat();
    const timer = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    window.addEventListener('online', sendHeartbeat);
    document.addEventListener('visibilitychange', sendHeartbeat);
    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener('online', sendHeartbeat);
      document.removeEventListener('visibilitychange', sendHeartbeat);
      controller?.abort();
    };
  }, [isVisitorPage]);

  return null;
}
