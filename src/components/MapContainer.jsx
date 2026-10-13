import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import * as turf from '@turf/turf';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePoiStore } from '../stores/poiStore';
import { saveOfflinePOIs } from '../services/db';

const HUE_POIS = [
  {
    id: 'dai-noi',
    name: 'Đại Nội Huế (Hoàng Thành)',
    lng: 107.5778,
    lat: 16.4697,
    radius: 180, // mét
    description: 'Đại Nội Huế là trung tâm chính trị, văn hóa của triều Nguyễn, được UNESCO công nhận là Di sản Văn hóa Thế giới năm 1993.'
  },
  {
    id: 'chua-thien-mu',
    name: 'Chùa Thiên Mụ',
    lng: 107.5451,
    lat: 16.4534,
    radius: 140,
    description: 'Ngôi chùa cổ kính hơn 400 năm tuổi soi bóng bên dòng sông Hương, biểu tượng tâm linh gắn liền với lịch sử cố đô.'
  },
  {
    id: 'cho-dong-ba',
    name: 'Chợ Đông Ba',
    lng: 107.5902,
    lat: 16.4695,
    radius: 120,
    description: 'Khu chợ truyền thống sầm uất bậc nhất xứ Huế, thiên đường ẩm thực với bún bò, bánh bèo, chè hẻm.'
  }
];

export default function MapContainer() {
  const mapContainerRef = useRef(null);
  const { setActivePoi, setPois } = usePoiStore();

  useEffect(() => {
    setPois(HUE_POIS);
    saveOfflinePOIs(HUE_POIS, 'vi').catch(console.error);

    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [107.5778, 16.4697], // Mặc định Đại Nội Huế
      zoom: 15,
      minZoom: 10,
      maxZoom: 18.5
    });

    // Ép Map tính toán đúng kích thước để hiện nút + / - ngay
setTimeout(() => {
      map.resize();
    }, 100);

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      // 1. Thử vẽ vòng tròn qua GeoJSON Source nếu Worker khả dụng
      try {
        const circleFeatures = HUE_POIS.map(poi => {
          return turf.circle([poi.lng, poi.lat], poi.radius, {
            steps: 64,
            units: 'meters',
            properties: { id: poi.id, name: poi.name }
          });
        });

        map.addSource('geofence-circles-src', {
          type: 'geojson',
          data: turf.featureCollection(circleFeatures)
        });

        map.addLayer({
          id: 'geofence-fill',
          type: 'fill',
          source: 'geofence-circles-src',
          paint: {
            'fill-color': '#e53935',
            'fill-opacity': 0.35
          }
        });

        map.addLayer({
          id: 'geofence-border',
          type: 'line',
          source: 'geofence-circles-src',
          paint: {
            'line-color': '#b71c1c',
            'line-width': 3,
            'line-dasharray': [2, 2]
          }
        });
      } catch (err) {
        console.warn('GeoJSON layer fallback to DOM marker', err);
      }

      // 2. Cắm Markers và thêm vòng tròn hiệu ứng pulse bằng DOM (Không bao giờ lỗi)
      HUE_POIS.forEach(poi => {
        // Tạo container bọc cả ghim và vòng bán kính
        const el = document.createElement('div');
        el.style.position = 'relative';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.cursor = 'pointer';

        // Vòng tròn bán kính Geofence trực tiếp bằng CSS/DOM
        const circle = document.createElement('div');
        circle.style.position = 'absolute';
        circle.style.width = '120px';
        circle.style.height = '120px';
        circle.style.borderRadius = '50%';
        circle.style.backgroundColor = 'rgba(229, 57, 53, 0.25)';
        circle.style.border = '2px dashed #b71c1c';
        circle.style.pointerEvents = 'none';

        // Biểu tượng ghim đỏ
        const pin = document.createElement('div');
        pin.innerHTML = `
          <svg width="32" height="42" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 21 12 32 12 32C12 32 24 21 24 12C24 5.37 18.63 0 12 0Z" fill="#b71c1c"/>
            <circle cx="12" cy="12" r="5" fill="#ffffff"/>
          </svg>
        `;

        el.appendChild(circle);
        el.appendChild(pin);

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setActivePoi(poi);
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([poi.lng, poi.lat])
          .addTo(map);
      });
    });

    return () => map.remove();
  }, [setActivePoi, setPois]);

return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}