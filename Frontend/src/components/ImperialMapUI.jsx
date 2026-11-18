import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE, getCuratedPhoto, getPoiImage } from '../utils/poiImages';

const normalize = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .trim();

const getArea = (poi) => (poi.address || '').split(',')[0].trim() || 'Thành phố Huế';

function straightLineKm(from, to) {
  const lat1 = Number(from?.lat);
  const lng1 = Number(from?.lng);
  const lat2 = Number(to?.lat);
  const lng2 = Number(to?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return null;
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function PalaceMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 13 9 9h14l7 4H2Z" />
      <path d="m10 8 3-4h6l3 4M15 4l1-3 1 3" />
      <path d="M5 14v12h22V14M3 27h26M2 30h28" />
      <path d="M13 26v-5a3 3 0 0 1 6 0v5M9 16v8M23 16v8" />
    </svg>
  );
}

export default function ImperialMapHeader({ language = 'vi' }) {
  return (
    <header className="regal-map-header">
      <Link to="/home" className="regal-map-header__brand">
        <span className="regal-map-header__logo">H</span>
        <span>
          <strong>HUẾ <em>GO</em></strong>
          <small>KHÁM PHÁ DI SẢN CỐ ĐÔ</small>
        </span>
      </Link>
      <nav className="regal-map-header__nav" aria-label="Điều hướng bản đồ">
        <Link to="/home">Khám phá</Link>
        <span className="is-active" aria-current="page">Bản đồ</span>
        <Link to="/destinations">Điểm đến</Link>
      </nav>
      <span className="regal-map-header__language">◉ {String(language).toUpperCase()} · HUẾ</span>
    </header>
  );
}

function HeritageResult({ poi, active, userPosition, onSelect }) {
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const sources = [getPoiImage(poi), getCuratedPhoto(poi.name), FALLBACK_IMAGE];
  const photo = sources[Math.min(fallbackIndex, sources.length - 1)];
  const distanceKm = straightLineKm(userPosition, poi);

  return (
    <button type="button" className={`royal-directory__item ${active ? 'is-active' : ''}`}
      onClick={() => onSelect(poi)} aria-pressed={active}>
      <img src={photo} alt="" loading="lazy"
        onError={() => setFallbackIndex(i => Math.min(i + 1, sources.length - 1))} />
      <span className="royal-directory__item-body">
        <strong>{poi.name}</strong>
        <small><PalaceMark size={13} />{poi.category || 'Di tích lịch sử'}</small>
      </span>
      <span className="royal-directory__item-side">
        {distanceKm !== null && (
          <span className="royal-directory__distance"
            title="Khoảng cách đường chim bay đến vị trí đang chọn">
            ⌖ {distanceKm.toFixed(1)} km
          </span>
        )}
        <span className="royal-directory__arrow" aria-hidden="true">›</span>
      </span>
    </button>
  );
}

export function ImperialMapSearch({
  pois = [], onSelect, onFitAll,
  selectedPoiId = null, userPosition = null
}) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [area, setArea] = useState('all');
  const [expanded, setExpanded] = useState(false);

  const categories = useMemo(() =>
    [...new Set(pois.map(p => p.category).filter(Boolean))].sort(), [pois]);
  const areas = useMemo(() =>
    [...new Set(pois.map(getArea))].sort(), [pois]);
  const filtered = useMemo(() => {
    const term = normalize(query);
    return pois.filter(p =>
      (!term || normalize(`${p.name} ${p.address || ''} ${p.description || ''}`).includes(term)) &&
      (category === 'all' || p.category === category) &&
      (area === 'all' || getArea(p) === area)
    );
  }, [pois, query, category, area]);
  const visible = expanded ? filtered : filtered.slice(0, 5);

  return (
    <section className="royal-directory" aria-label="Danh sách điểm đến trên bản đồ">
      <div className="royal-directory__heading">
        <span className="royal-directory__title"><PalaceMark size={22} /> KHÁM PHÁ ĐIỂM ĐẾN</span>
        <small>{filtered.length} địa điểm</small>
      </div>

      <div className="royal-directory__search">
        <span aria-hidden="true">⌕</span>
        <input type="search" value={query} onChange={e => { setQuery(e.target.value); setExpanded(false); }}
          placeholder="Tìm di tích, địa điểm..." aria-label="Tìm di tích trên bản đồ" />
        {query && <button type="button" onClick={() => setQuery('')} aria-label="Xóa tìm kiếm">×</button>}
      </div>
      <div className="royal-directory__filters">
        <label>
          <span className="sr-only">Loại điểm đến</span>
          <select value={category} onChange={e => { setCategory(e.target.value); setExpanded(false); }}>
            <option value="all">Tất cả loại điểm đến</option>
            {categories.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Khu vực</span>
          <select value={area} onChange={e => { setArea(e.target.value); setExpanded(false); }}>
            <option value="all">Tất cả khu vực</option>
            {areas.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="royal-directory__list">
        {visible.map(poi => <HeritageResult key={poi.id} poi={poi}
          active={String(selectedPoiId) === String(poi.id)}
          userPosition={userPosition} onSelect={onSelect} />)}
        {filtered.length === 0 && <p className="royal-directory__empty">Chưa tìm thấy địa điểm phù hợp.</p>}
      </div>

      {filtered.length > 5 && (
        <button type="button" className="royal-directory__more" onClick={() => setExpanded(v => !v)}>
          {expanded ? 'Thu gọn danh sách ↑' : `Xem thêm ${filtered.length - 5} địa điểm ↓`}
        </button>
      )}
      <button type="button" className="royal-directory__all"
        disabled={filtered.length === 0 || !onFitAll}
        onClick={() => onFitAll?.(filtered)}>
        <span>⌖</span> Hiển thị tất cả trên bản đồ <span aria-hidden="true">↗</span>
      </button>
      <p className="royal-directory__footnote">{userPosition
        ? 'Khoảng cách là đường chim bay từ vị trí đang chọn.'
        : 'Bật GPS để xem khoảng cách đến các di tích.'}</p>
    </section>
  );
}

export function ImperialMapLegend({ pois = [] }) {
  const categories = useMemo(() => {
    const counts = new Map();
    pois.forEach(p => {
      const name = p.category || 'Di tích lịch sử';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()];
  }, [pois]);
  return (
    <aside className="royal-map-legend" aria-label="Chú thích bản đồ">
      <h3>CHÚ THÍCH BẢN ĐỒ</h3>
      {categories.map(([name, count]) => (
        <div key={name} className="royal-map-legend__row">
          <span className="royal-map-legend__symbol"><PalaceMark size={16} /></span>
          <span>{name}</span>
          <strong>{count}</strong>
        </div>
      ))}
      {!categories.length && <p>Đang tải danh sách di tích...</p>}
      <div className="royal-map-legend__row royal-map-legend__radius">
        <span className="royal-map-legend__circle" />
        <span>Vùng nhận diện Geofence</span>
      </div>
    </aside>
  );
}
