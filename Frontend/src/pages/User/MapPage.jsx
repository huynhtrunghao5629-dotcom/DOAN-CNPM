import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapPage.css';
import './OfflineMap.css';
import { Link, useLocation } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { startLocationTracking } from '../../services/LocationService';
import { createGeofenceWatcher, nearbyPois } from '../../services/GeofenceEngine';
import GpsSimulator from '../../components/GpsSimulator';
import AudioPlayerBar from '../../components/AudioPlayerBar';
import { getPoiImage, getCuratedPhoto, FALLBACK_IMAGE } from '../../utils/poiImages';


maplibregl.setWorkerUrl(workerUrl);

// Offline schematic deliberately does not promise street-level offline maps.
// Markers and geofence coordinates remain geographically correct via MapLibre.
const ONLINE_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};
// Bản đồ Offline đọc GeoJSON cục bộ, KHÔNG gọi máy chủ tile.
// Chạy `npm run offline:prepare` lúc có mạng để cập nhật dữ liệu thật từ OSM.
const OFFLINE_STYLE = {
  version: 8,
  sources: {
    hueOffline: { type: 'geojson', data: '/offline/hue-basemap.geojson' },
  },
  layers: [
    { id: 'offline-background', type: 'background', paint: { 'background-color': '#edf5ee' } },
    { id: 'offline-parks', type: 'fill', source: 'hueOffline', filter: ['==', ['get','kind'], 'park'], paint: { 'fill-color': '#b7dbac', 'fill-opacity': 0.85 } },
    { id: 'offline-water-areas', type: 'fill', source: 'hueOffline', filter: ['==', ['get','kind'], 'water-area'], paint: { 'fill-color': '#a6cee1' } },
    { id: 'offline-water-lines', type: 'line', source: 'hueOffline', filter: ['==', ['get','kind'], 'water-line'], paint: { 'line-color': '#80b9dc', 'line-width': ['interpolate',['linear'],['zoom'],10,1,16,5] } },
    { id: 'offline-roads-casing', type: 'line', source: 'hueOffline', filter: ['in',['get','kind'],['literal',['road','road-major']]], paint: { 'line-color': '#c1c5c2', 'line-width': ['interpolate',['linear'],['zoom'],10,1.5,16,9] } },
    { id: 'offline-roads', type: 'line', source: 'hueOffline', filter: ['==',['get','kind'],'road'], paint: { 'line-color': '#fffdf6', 'line-width': ['interpolate',['linear'],['zoom'],10,1,16,6] } },
    { id: 'offline-roads-major', type: 'line', source: 'hueOffline', filter: ['==',['get','kind'],'road-major'], paint: { 'line-color': '#f5dfaa', 'line-width': ['interpolate',['linear'],['zoom'],10,1.7,16,8] } },
  ],
};

export default function MapPage() {
  const location = useLocation();
  const requestedPoiId = new URLSearchParams(location.search).get('poi');
  const focusedPoiIdRef = useRef(null);
  const nodeRef = useRef(null), mapRef = useRef(null), markersRef = useRef([]), userMarkerRef = useRef(null);
  const watchStopRef = useRef(null);
  const centeredOnGpsRef = useRef(false);
  const pois = usePoiStore(s => s.pois), fetchPois = usePoiStore(s => s.fetchPois);
  const activePoi = usePoiStore(s => s.activePoi), setActivePoi = usePoiStore(s => s.setActivePoi);
  const userPosition = usePoiStore(s => s.userPosition), setUserPosition = usePoiStore(s => s.setUserPosition);
  const loading = usePoiStore(s => s.loading), error = usePoiStore(s => s.error);
  const currentLanguage = usePoiStore(s => s.currentLanguage);
  const setCurrentLanguage = usePoiStore(s => s.setCurrentLanguage);
  const [gpsOn,setGpsOn] = useState(false), [gpsError,setGpsError] = useState(''), [simOn,setSimOn] = useState(false), [nearby,setNearby] = useState([]), [entered,setEntered] = useState(null);
  // Desktop luôn hiển thị đầy đủ, Mobile mặc định chỉ hiện tiêu đề.
  const [controlsExpanded, setControlsExpanded] = useState(false);
  const [showAudio, setShowAudio] = useState(false);
  const [offlineMode, setOfflineMode] = useState(() => !navigator.onLine);
  const [offlineShapes, setOfflineShapes] = useState([]);
  const [offlineRoadsReady, setOfflineRoadsReady] = useState(null);
  const firstStyleRef = useRef(true);
  const poisRef = useRef(pois);
  const setActivePoiRef = useRef(setActivePoi);
  const watcherRef = useRef(null);
  if (!watcherRef.current) watcherRef.current = createGeofenceWatcher(p => setEntered(p));

  useEffect(()=>{fetchPois().catch(console.warn);},[fetchPois]);
  // Đổi POI thì quay lại thẻ xem nhanh; không tự phát âm thanh.
  useEffect(() => { setShowAudio(false); }, [activePoi?.id]);
  useEffect(() => {
    // DevTools Network > Offline triggers this event in modern Chrome.
    const updateConnectivity = () => setOfflineMode(!navigator.onLine);
    window.addEventListener('online', updateConnectivity);
    window.addEventListener('offline', updateConnectivity);
    const timer = window.setInterval(updateConnectivity, 2000);
    return () => {
      window.removeEventListener('online', updateConnectivity);
      window.removeEventListener('offline', updateConnectivity);
      window.clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    let canceled = false;
    fetch('/offline/hue-basemap.geojson')
      .then(r => { if (!r.ok) throw new Error('Chưa có bản đồ'); return r.json(); })
      .then(data => { if (!canceled) setOfflineRoadsReady(Array.isArray(data.features) && data.features.length > 0); })
      .catch(() => { if (!canceled) setOfflineRoadsReady(false); });
    return () => { canceled = true; };
  }, []);
  // POI data can arrive from IndexedDB after the map has initialized.
  // Keep latest data in refs so the MapLibre style.load listener never uses stale POIs.
  poisRef.current = pois;
  setActivePoiRef.current = setActivePoi;

  // Offline overlay: uses geographical projections from MapLibre but draws
  // its own DOM/SVG, independently of MapLibre style sources and tile loading.
  const repaintOfflineRef = useRef(() => {});
  repaintOfflineRef.current = () => {
    const map = mapRef.current;
    if (!map) return;
    const features = (poisRef.current || [])
      .map(p => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180);
    const shapes = features.map(p => {
      const point = map.project([p.lng, p.lat]);
      const coords = turf.circle([p.lng, p.lat], Number(p.radius) > 0 ? Number(p.radius) : 150,
        { steps: 64, units: 'meters' }).geometry.coordinates[0];
      const path = coords.map(([lng, lat], i) => {
        const pixel = map.project([lng, lat]);
        return `${i === 0 ? 'M' : 'L'}${pixel.x.toFixed(2)},${pixel.y.toFixed(2)}`;
      }).join(' ') + ' Z';
      return { poi: p, x: point.x, y: point.y, path };
    });
    setOfflineShapes(shapes);
  };

  const repaintPoisRef = useRef(() => {});
  repaintPoisRef.current = (onStyleLoad = false) => {
    const map = mapRef.current;
    if (!map || (!onStyleLoad && !map.isStyleLoaded())) return;
    if (!navigator.onLine) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      return;
    }

    const valid = (poisRef.current || [])
      .map(p => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }))
      .filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng)
        && p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180);
    const collection = turf.featureCollection(valid.map(p =>
      turf.circle([p.lng, p.lat], Number(p.radius) > 0 ? Number(p.radius) : 150,
        { steps: 64, units: 'meters', properties: { id: String(p.id) } })
    ));

    // setStyle() deletes custom sources/layers. Recreate them on every style.load.
    if (!map.getSource('geofence')) {
      map.addSource('geofence', { type: 'geojson', data: collection });
    } else {
      map.getSource('geofence').setData(collection);
    }
    if (!map.getLayer('geofence-fill')) {
      map.addLayer({ id: 'geofence-fill', type: 'fill', source: 'geofence',
        paint: { 'fill-color': '#e53935', 'fill-opacity': 0.18 } });
    }
    if (!map.getLayer('geofence-outline')) {
      map.addLayer({ id: 'geofence-outline', type: 'line', source: 'geofence',
        paint: { 'line-color': '#b71c1c', 'line-width': 2.5 } });
    }

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = valid.map(p => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '📍';
      btn.title = p.name;
      btn.setAttribute('aria-label', p.name);
      btn.style.cssText = 'background:#fff;border:2px solid #b71c1c;border-radius:50%;width:38px;height:38px;cursor:pointer;display:grid;place-items:center;box-shadow:0 2px 8px #0003';
      btn.onclick = () => setActivePoiRef.current(p);
      return new maplibregl.Marker({ element: btn, anchor: 'center' })
        .setLngLat([p.lng, p.lat]).addTo(map);
    });
  };

  useEffect(() => {
    const map = new maplibregl.Map({
      container: nodeRef.current,
      style: navigator.onLine ? ONLINE_STYLE : OFFLINE_STYLE,
      center: [107.5778, 16.4697], zoom: 12, minZoom: 9, maxZoom: 19,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl(), 'top-right');
    const repaint = () => { repaintPoisRef.current(true); repaintOfflineRef.current(); };
    const moveOverlay = () => repaintOfflineRef.current();
    // Must remain registered for the lifetime of the map, including style changes.
    map.on('style.load', repaint);
    map.on('load', repaint);
    map.on('move', moveOverlay);
    map.on('resize', moveOverlay);
    const timer = setTimeout(() => map.resize(), 150);
    return () => {
      clearTimeout(timer);
      map.off('style.load', repaint);
      map.off('load', repaint);
      map.off('move', moveOverlay);
      map.off('resize', moveOverlay);
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Trang chi tiết truyền ?poi=<id>. Tự mở đúng địa điểm và zoom tới marker,
  // kể cả khi danh sách POI vừa được tải từ API hoặc IndexedDB (Offline).
  useEffect(() => {
    if (!requestedPoiId) {
      focusedPoiIdRef.current = null;
      return;
    }
    const poi = pois.find(p => String(p.id) === String(requestedPoiId));
    const lat = Number(poi?.lat);
    const lng = Number(poi?.lng);
    const map = mapRef.current;
    if (!poi || !map || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (focusedPoiIdRef.current === requestedPoiId) return;
    focusedPoiIdRef.current = requestedPoiId;
    setActivePoi(poi); // Bottom Sheet cùng ảnh và thông tin với trang chủ.
    setShowAudio(false);
    setEntered(null);
    map.flyTo({ center: [lng, lat], zoom: 16, duration: 900, essential: true });
  }, [requestedPoiId, pois, setActivePoi]);

  useEffect(() => {
    // Initial style is supplied in the MapLibre constructor.
    if (firstStyleRef.current) { firstStyleRef.current = false; return; }
    const map = mapRef.current;
    if (map) {
      map.setStyle(offlineMode ? OFFLINE_STYLE : ONLINE_STYLE);
      repaintOfflineRef.current();
    }
  }, [offlineMode]);

  useEffect(() => {
    // POIs can be loaded/updated while offline without a style change.
    repaintPoisRef.current();
    repaintOfflineRef.current();
  }, [pois]);
  useEffect(()=>{
    if(!userPosition)return;
    const map=mapRef.current;if(!map)return;
    if(!userMarkerRef.current){const el=document.createElement('div');el.style.cssText='height:17px;width:17px;background:#1684d4;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px #1684d466';userMarkerRef.current=new maplibregl.Marker({element:el}).setLngLat([userPosition.lng,userPosition.lat]).addTo(map);}
    else userMarkerRef.current.setLngLat([userPosition.lng,userPosition.lat]);
    // Chỉ tự đưa bản đồ tới GPS thật một lần; tránh giật khi người dùng kéo bản đồ.
    if (userPosition.source === 'gps' && gpsOn && !centeredOnGpsRef.current) {
      centeredOnGpsRef.current = true;
      map.flyTo({center:[userPosition.lng,userPosition.lat],zoom:15,essential:true});
    }
    setNearby(nearbyPois(userPosition,pois));
    // Tick nhờ vị trí cập nhật; xác nhận geofence thêm bằng interval phía dưới.
  },[userPosition,pois,gpsOn]);
  useEffect(()=>{const timer=setInterval(()=>{if(userPosition)watcherRef.current.update(userPosition,pois);},1000);return()=>clearInterval(timer);},[userPosition,pois]);
  useEffect(()=>()=>watchStopRef.current?.(),[]);
  const disableGps=()=>{watchStopRef.current?.();watchStopRef.current=null;setGpsOn(false);centeredOnGpsRef.current=false;};
  const enableGps=()=>{disableGps();setSimOn(false);setEntered(null);setGpsError('');watcherRef.current.reset();watchStopRef.current=startLocationTracking(p=>setUserPosition(p),setGpsError);setGpsOn(true);};
  const centerOnMyLocation=()=>{
    if (!gpsOn) { enableGps(); return; }
    if (userPosition?.source === 'gps' && Number.isFinite(userPosition.lat) && Number.isFinite(userPosition.lng)) {
      mapRef.current?.flyTo({center:[userPosition.lng,userPosition.lat],zoom:16,essential:true});
    } else {
      setGpsError('Đang chờ tín hiệu GPS thật từ thiết bị...');
    }
  };
  const simulate=(p)=>{disableGps();setSimOn(true);setGpsError('');setEntered(null);watcherRef.current.reset();setUserPosition(p);mapRef.current?.flyTo({center:[p.lng,p.lat],zoom:16});if(window.matchMedia('(max-width:640px)').matches)setControlsExpanded(false);};
  return (
    <div className="hue-map-page">
      <div ref={nodeRef} className="hue-map-canvas" />
      {offlineMode && (
        <div aria-label="Các di tích trên sơ đồ ngoại tuyến" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5, overflow: 'hidden' }}>
          <svg aria-hidden="true" style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {offlineShapes.map(shape => (
              <path key={`fence-${shape.poi.id}`} d={shape.path}
                fill="rgba(229,57,53,0.16)" stroke="#b71c1c" strokeWidth="2.5" />
            ))}
          </svg>
          {offlineShapes.map(shape => (
            <button key={`marker-${shape.poi.id}`} type="button"
              title={shape.poi.name} aria-label={`Xem di tích ${shape.poi.name}`}
              onClick={() => setActivePoi(shape.poi)}
              style={{ position: 'absolute', left: shape.x, top: shape.y,
                transform: 'translate(-50%, -50%)', width: 38, height: 38,
                borderRadius: '50%', border: '2px solid #b71c1c', background: '#fff',
                display: 'grid', placeItems: 'center', fontSize: 20,
                boxShadow: '0 2px 8px #0003', pointerEvents: 'auto', cursor: 'pointer' }}>
              📍
            </button>
          ))}
        </div>
      )}
      {offlineMode && !loading && pois.length === 0 && (
        <div role="status" style={{ position: 'absolute', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 16, maxWidth: 'min(320px, 85vw)', padding: '12px 15px', borderRadius: 12, background: '#fff', boxShadow: '0 5px 20px #0002', fontSize: 13, textAlign: 'center', color: '#344054' }}>
          Chưa có di tích được lưu ngoại tuyến. Hãy kết nối mạng, mở bản đồ và chờ tải dữ liệu xong trước khi thử Offline.
        </div>
      )}
      {offlineMode && (
        <div className="hue-offline-map-banner" role="status">
          <strong>◉ Sơ đồ ngoại tuyến</strong>
          <span>{offlineRoadsReady ? 'Đường sá & sông được đọc từ bản đồ Huế đã lưu. Phạm vi chỉ gồm vùng quanh di tích.' : 'Chưa có dữ liệu đường phố Huế. Chạy npm run offline:prepare khi có mạng, rồi build lại.'}</span>
        </div>
      )}
      <aside className={`hue-map-sidebar ${controlsExpanded ? "is-expanded" : "is-collapsed"} ${simOn ? "is-simulating" : ""}`} aria-label="Điều khiển bản đồ">
        <div className="hue-map-panel">
          <Link className="hue-map-home" to="/home">← Trở về trang chủ</Link>
          <div className="hue-map-panel-heading">
            <div className="hue-map-panel-symbol">⌖</div>
            <div>
              <h2>Khám phá Huế</h2>
              <p>Bản đồ di sản & thuyết minh</p>
            </div>
            <button type="button" className="hue-mobile-toggle" aria-label={controlsExpanded ? "Thu gọn bảng điều khiển" : "Mở bảng điều khiển"} aria-expanded={controlsExpanded} onClick={() => setControlsExpanded(v => !v)}>
              <span aria-hidden="true">{controlsExpanded ? "⌃" : "☷"}</span>
            </button>
          </div>
          <div className="hue-map-control-details">
          <div className="hue-map-actions">
            <button type="button" className={`hue-btn hue-btn-primary ${gpsOn ? 'hue-btn-active' : ''}`} onClick={gpsOn ? disableGps : enableGps}>
              <span aria-hidden="true">📍</span> {gpsOn ? 'Tắt GPS thật' : 'Bật GPS thật'}
            </button>
            <button type="button" aria-expanded={simOn} className={`hue-btn hue-btn-outline ${simOn ? 'hue-btn-active' : ''}`} onClick={() => { disableGps(); setControlsExpanded(true); setSimOn(v => !v); }}>
              <span aria-hidden="true">🧪</span> {simOn ? 'Ẩn giả lập' : 'GPS giả lập'}
            </button>
          </div>
          <label className="hue-map-field-label" htmlFor="hue-map-language">🌐 Ngôn ngữ thuyết minh</label>
          <select id="hue-map-language" className="hue-map-select" value={currentLanguage} onChange={e => setCurrentLanguage(e.target.value)}>
            <option value="vi">🇻🇳 Tiếng Việt</option>
            <option value="en">🇬🇧 English</option>
            <option value="zh">🇨🇳 中文</option>
            <option value="ja">🇯🇵 日本語</option>
            <option value="ko">🇰🇷 한국어</option>
          </select>
          <div className="hue-map-status">
            <div className="hue-map-status-top">
              <span className="hue-map-status-label"><span className="hue-status-dot"/> Trạng thái vị trí</span>
              <span className="hue-map-status-kind">{userPosition ? (userPosition.source === 'simulator' ? 'DEMO' : 'GPS') : 'CHƯA BẬT'}</span>
            </div>
            <div className="hue-map-status-detail">
              {userPosition
                ? <>Gần nhất: <strong>{nearby[0] ? `${nearby[0].name} · ${Math.round(nearby[0].distance)} m` : 'Chưa có di tích'}</strong></>
                : 'Bật GPS hoặc chọn điểm giả lập để bắt đầu khám phá.'}
            </div>
          </div>
          {gpsError && <p className="hue-map-error" role="alert">{gpsError}</p>}
          {(loading || error) && <p className="hue-map-notice" role="status">{loading ? 'Đang tải địa điểm...' : 'Không kết nối được API. Đang sử dụng dữ liệu ngoại tuyến.'}</p>}
          </div>
        </div>
        {simOn && <GpsSimulator onSimulate={simulate} onDisable={() => setSimOn(false)} />}
      </aside>
      <button
        type="button"
        className={`hue-map-location-fab ${gpsOn ? 'is-on' : ''}`}
        onClick={centerOnMyLocation}
        aria-label={gpsOn ? 'Đưa bản đồ về vị trí GPS thật của tôi' : 'Bật định vị GPS thật'}
        title={gpsOn ? 'Về vị trí của tôi' : 'Bật GPS thật'}
      >
        <span aria-hidden="true">⌖</span>
        <span className="hue-map-location-fab-text">{gpsOn ? 'Vị trí tôi' : 'Bật GPS'}</span>
      </button>
      {entered && (
        <div className="hue-map-entered" role="status">
          <div className="hue-map-entered-icon" aria-hidden="true">📍</div>
          <div className="hue-map-entered-content">
            <span className="hue-map-eyebrow">ĐÃ ĐẾN ĐỊA ĐIỂM</span>
            <h3>{entered.name}</h3>
            <p>Bạn có muốn khám phá câu chuyện của di tích này qua thuyết minh không?</p>
            <div className="hue-map-entered-actions">
              <button type="button" className="hue-btn hue-btn-primary" onClick={() => { setActivePoi(entered); setShowAudio(true); setEntered(null); }}>▶ Mở thuyết minh</button>
              <button type="button" className="hue-btn hue-btn-outline" onClick={() => setEntered(null)}>Để sau</button>
            </div>
          </div>
        </div>
      )}
      {!entered && activePoi && !showAudio && (
        <section className="hue-poi-sheet" aria-label={`Thông tin nhanh ${activePoi.name}`}>
          <div className="hue-poi-sheet-handle" aria-hidden="true" />
          <button className="hue-poi-sheet-close" type="button" aria-label="Đóng thông tin địa điểm" onClick={() => setActivePoi(null)}>×</button>
          <div className="hue-poi-sheet-photo">
            <img
              src={getPoiImage(activePoi)}
              alt={`Ảnh ${activePoi.name}`}
              loading="lazy"
              onError={e => { const img = e.currentTarget; const curated = getCuratedPhoto(activePoi.name); const step = Number(img.dataset.fallbackStep || 0); img.dataset.fallbackStep = String(step + 1); if (step === 0 && curated !== FALLBACK_IMAGE && !img.src.endsWith(curated)) img.src = curated; else if (step < 2 && !img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE; }}
            />
          </div>
          <div className="hue-poi-sheet-body">
            <span className="hue-poi-sheet-kicker">✦ DI SẢN CỐ ĐÔ HUẾ</span>
            <h3>{activePoi.name}</h3>
            <p>{activePoi.description || 'Khám phá câu chuyện và những nét đẹp của di tích này.'}</p>
            <div className="hue-poi-sheet-actions">
              <button type="button" className="hue-btn hue-btn-primary" onClick={() => setShowAudio(true)}>▶ Nghe thuyết minh</button>
              <Link className="hue-poi-sheet-detail" to={`/poi/${encodeURIComponent(activePoi.id)}`}>Xem chi tiết ↗</Link>
            </div>
          </div>
        </section>
      )}
      {!entered && activePoi && showAudio && <AudioPlayerBar />}

    </div>
  );
}
