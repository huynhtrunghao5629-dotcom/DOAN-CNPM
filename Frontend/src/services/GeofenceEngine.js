import * as turf from '@turf/turf';

export function nearbyPois(position, pois) {
  if (!position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng)) return [];
  return pois.filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)).map(p => {
    const distance = turf.distance([position.lng, position.lat], [p.lng, p.lat], { units: 'kilometers' }) * 1000;
    const radius = Number(p.radius) > 0 ? Number(p.radius) : 150;
    return { ...p, distance, radius, inside: distance <= radius };
  }).sort((a, b) => a.distance - b.distance);
}

// Xác nhận vị trí ở trong vùng liên tục 3s; hạn chế gọi lại cùng một di tích trong 5 phút.
export function createGeofenceWatcher(onEnter) {
  const pending = new Map();
  const lastTriggered = new Map();
  return {
    update(position, pois) {
      const now = Date.now();
      const current = nearbyPois(position, pois);
      for (const poi of current) {
        if (!poi.inside || (position.source === 'gps' && Number(position.accuracy) > poi.radius)) {
          pending.delete(String(poi.id));
          continue;
        }
        const key = String(poi.id);
        if (!pending.has(key)) pending.set(key, now);
        if (now - pending.get(key) >= 3000 && now - (lastTriggered.get(key) || 0) >= 300000) {
          lastTriggered.set(key, now);
          pending.delete(key);
          onEnter(poi);
        }
      }
      const ids = new Set(current.filter(p => p.inside).map(p => String(p.id)));
      for (const key of pending.keys()) if (!ids.has(key)) pending.delete(key);
      return current;
    },
    reset() { pending.clear(); lastTriggered.clear(); }
  };
}
