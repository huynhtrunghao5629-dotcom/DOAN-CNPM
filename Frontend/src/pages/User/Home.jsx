
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import './Home.css';
import { FALLBACK_IMAGE, getCuratedPhoto, getPoiImage } from '../../utils/poiImages';

const CATEGORIES = [
  { id: 'all', label: 'Tất cả di tích', icon: '🏛️' },
];

const VISUALS = {
'Di tích lịch sử': {
  icon: '🏛️',
  color: 'heritage',
},
};

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function getCategory(poi) {
  return poi.category || 'Di tích lịch sử';
}

function readFavorites() {
  try {
    const value = JSON.parse(
      localStorage.getItem('hue_favorites') || '[]'
    );

    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function PoiCard({ poi, index, isFavorite, onFavorite }) {
  const category = getCategory(poi);
  const visual = VISUALS[category] || { icon: '🏛️', color: 'heritage' };
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = getPoiImage(poi);
  const curated = getCuratedPhoto(poi.name);
  const fallbackForImage = imageUrl !== curated && curated !== FALLBACK_IMAGE ? curated : FALLBACK_IMAGE;
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => { setImageFailed(false); setFallbackFailed(false); }, [imageUrl]);

  return (
    <article className="hue-poi-card">
      <div className={`hue-poi-visual ${visual.color}`}>
        <img
          className="hue-poi-photo"
          src={imageFailed ? (fallbackFailed ? FALLBACK_IMAGE : fallbackForImage) : imageUrl}
          alt={`Ảnh minh họa địa điểm ${poi.name}`}
          loading={index < 3 ? 'eager' : 'lazy'}
          decoding="async"
          onError={() => { if (imageFailed) setFallbackFailed(true); else setImageFailed(true); }}
        />
        <div className="hue-poi-photo-shade" aria-hidden="true" />

        <span className="hue-poi-card-index">
          HUẾ • {String(index + 1).padStart(2, '0')}
        </span>

        <span className="hue-poi-category">
          {category}
        </span>

        <button
          className={`hue-favorite ${
            isFavorite ? 'active' : ''
          }`}
          onClick={() => onFavorite(poi.id)}
          aria-label={
            isFavorite
              ? `Bỏ yêu thích ${poi.name}`
              : `Yêu thích ${poi.name}`
          }
          title="Lưu yêu thích"
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      </div>

      <div className="hue-poi-card-content">
        <div className="hue-poi-location">
          <span>📍</span> Thành phố Huế
        </div>

        <h3>{poi.name}</h3>

        <p className="hue-poi-description">
          {poi.description || 'Khám phá điểm đến tại Cố đô Huế.'}
        </p>

        <div className="hue-poi-card-footer">
          <span className="hue-poi-radius">
            ◎ {poi.radius ?? 50}m
          </span>

          <Link
            to={`/poi/${encodeURIComponent(poi.id)}`}
            className="hue-poi-detail"
          >
            Khám phá <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === '/destinations') {
      const t = setTimeout(() => document.getElementById('hue-destinations')?.scrollIntoView(), 80);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const pois = usePoiStore((state) => state.pois);
  const fetchPois = usePoiStore((state) => state.fetchPois);
  const loading = usePoiStore((state) => state.loading);
  const error = usePoiStore((state) => state.error);
  const source = usePoiStore((state) => state.source);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState(readFavorites);
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    // Lấy dữ liệu mới từ MongoDB khi mở trang chủ (Offline vẫn đọc IndexedDB).
    fetchPois({ force: true }).catch(console.warn);
  }, [fetchPois]);

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const updated = current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id];

      localStorage.setItem(
        'hue_favorites',
        JSON.stringify(updated)
      );

      return updated;
    });
  };

  const filteredPois = useMemo(() => {
    const keyword = normalizeText(search);

    return pois.filter((poi) => {
      const matchSearch =
        !keyword ||
        normalizeText(
          `${poi.name} ${poi.description || ''}`
        ).includes(keyword);

      const matchCategory =
        category === 'all' ||
        getCategory(poi) === category;

      const matchFavorite =
        !favoritesOnly || favorites.includes(poi.id);

      return matchSearch && matchCategory && matchFavorite;
    });
  }, [pois, search, category, favoritesOnly, favorites]);

  const displayedPois = filteredPois.slice(0, visibleCount);
  const heritageCount = pois.filter(p => /di tích|di tich/i.test(p.category || '')).length;

  const selectCategory = (id) => {
    setCategory(id);
    setVisibleCount(6);
  };

  const explore = () => {
    document
      .getElementById('hue-destinations')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="hue-home">
      {/* HEADER */}
      <header className="hue-navbar">
        <Link to="/home" className="hue-brand">
          <div className="hue-brand-icon">H</div>
          <div>
            <strong>HUẾ<span>GO</span></strong>
            <small>DISCOVER THE HERITAGE</small>
          </div>
        </Link>

        <nav className="hue-nav-links">
          <Link to="/home" className="selected">
            Khám phá
          </Link>
          <Link to="/map">Bản đồ</Link>
          <a href="#hue-destinations">Điểm đến</a>
        </nav>

        <button
          className="hue-nav-map"
          onClick={() => navigate('/map')}
        >
          ◉ Bản đồ du lịch <span>↗</span>
        </button>
      </header>

      {/* HERO */}
      <section className="hue-hero">
        <div className="hue-hero-overlay" />

        <div className="hue-hero-content">
          <div className="hue-eyebrow">
            <span className="hue-eyebrow-dot" />
            CHÀO MỪNG ĐẾN VỚI CỐ ĐÔ
          </div>

          <h1>
            Huế không chỉ là
            <br />
            điểm đến.
            <br />
            <em>Là một cảm xúc.</em>
          </h1>

          <p>
            Khám phá những di sản trăm năm, góc phố bình yên
            và nét văn hóa rất riêng của miền đất cố đô.
          </p>

          <div className="hue-hero-actions">
            <button
              className="hue-hero-primary"
              onClick={explore}
            >
              Khám phá ngay <span>↗</span>
            </button>

            <button
              className="hue-hero-secondary"
              onClick={() => navigate('/map')}
            >
              ◎ Xem bản đồ
            </button>
          </div>
        </div>

        <div className="hue-hero-bottom">
          <span>16°28′ BẮC · 107°35′ ĐÔNG</span>
          <span>VIETNAM — HUE CITY</span>
        </div>
      </section>

      {/* STATS */}
      <section className="hue-stats">
        <div>
          <strong>{pois.length.toString().padStart(2, '0')}</strong>
          <span>Điểm đến khám phá</span>
        </div>

<div>
  <strong>{heritageCount.toString().padStart(2, '0')}</strong>
  <span>Di tích lịch sử tiêu biểu</span>
</div>

        <div>
          <strong>01</strong>
          <span>Vùng đất di sản</span>
        </div>
      </section>

      {/* DESTINATIONS */}
      <section
        className="hue-destinations"
        id="hue-destinations"
      >
        <div className="hue-section-heading">
          <div>
            <span className="hue-section-kicker">
              ✦ KHÁM PHÁ THEO CÁCH CỦA BẠN
            </span>

            <h2>
              Những điểm đến
              <br />
              <em>không thể bỏ lỡ.</em>
            </h2>
          </div>

          <p>
            Từ những di tích cổ kính đến những góc bình yên,
            Huế luôn có điều thú vị đang chờ bạn.
          </p>
        </div>

        {/* SEARCH */}
        <div className="hue-search-panel">
          <div className="hue-search-box">
            <span className="hue-search-icon">⌕</span>

            <input
              type="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setVisibleCount(6);
              }}
              placeholder="Bạn muốn khám phá nơi nào ở Huế?"
              aria-label="Tìm kiếm địa điểm du lịch"
            />

            {search && (
              <button
                className="hue-clear-search"
                onClick={() => setSearch('')}
                aria-label="Xóa từ khóa"
              >
                ×
              </button>
            )}
          </div>

          <button
            className="hue-search-button"
            onClick={explore}
          >
            Tìm điểm đến ↗
          </button>
        </div>

        {/* FILTERS */}
        <div className="hue-filters">
          <div className="hue-category-list">
            {CATEGORIES.map((item) => (
              <button
                key={item.id}
                className={`hue-filter ${
                  category === item.id ? 'active' : ''
                }`}
                onClick={() => selectCategory(item.id)}
              >
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>

          <button
            className={`hue-favorites-toggle ${
              favoritesOnly ? 'active' : ''
            }`}
            onClick={() => {
              setFavoritesOnly(!favoritesOnly);
              setVisibleCount(6);
            }}
          >
            ♥ Yêu thích ({favorites.length})
          </button>
        </div>

        <div className="hue-results-line">
          <span>
            <strong>{filteredPois.length}</strong> địa điểm
            được tìm thấy
          </span>
          <span>KHÁM PHÁ HUẾ • 2026</span>
        </div>

        {loading && pois.length === 0 && (
          <div className="hue-poi-grid" role="status" aria-label="Đang tải danh sách di tích">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="hue-poi-skeleton" key={i} aria-hidden="true">
                <div className="hue-skeleton-photo hue-shimmer" />
                <div className="hue-skeleton-content">
                  <div className="hue-skeleton-line hue-shimmer" style={{ width: '35%' }} />
                  <div className="hue-skeleton-line hue-shimmer" style={{ width: '75%', height: 23 }} />
                  <div className="hue-skeleton-line hue-shimmer" />
                  <div className="hue-skeleton-line hue-shimmer" style={{ width: '85%' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p role="alert" style={{ color: '#9b4d19', marginBottom: 18 }}>
          {source === 'offline' ? 'Đang sử dụng dữ liệu ngoại tuyến: ' : 'Không tải được dữ liệu: '}{error}
        </p>}
        {/* CARDS */}
        {(!loading || pois.length > 0) && (filteredPois.length > 0 ? (
          <>
            <div className="hue-poi-grid">
              {displayedPois.map((poi, index) => (
                <PoiCard
                  key={poi.id}
                  poi={poi}
                  index={index}
                  isFavorite={favorites.includes(poi.id)}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>

            {visibleCount < filteredPois.length && (
              <div className="hue-more-wrap">
                <button
                  className="hue-more-button"
                  onClick={() =>
                    setVisibleCount((count) => count + 6)
                  }
                >
                  Xem thêm địa điểm ↓
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="hue-empty">
            <span>🔎</span>
            <h3>Chưa tìm thấy địa điểm phù hợp</h3>
            <p>
              Hãy thử một từ khóa hoặc nhóm địa điểm khác.
            </p>
            <button
              onClick={() => {
                setSearch('');
                setCategory('all');
                setFavoritesOnly(false);
              }}
            >
              Xem tất cả địa điểm
            </button>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="hue-map-cta">
        <div className="hue-map-cta-decoration">⌖</div>

        <div>
          <span>DU LỊCH THÔNG MINH</span>
          <h2>
            Cả thành phố Huế,
            <br />
            trong tầm tay bạn.
          </h2>
          <p>
            Khám phá vị trí điểm tham quan và các vùng
            địa lý trên bản đồ tương tác.
          </p>
          <button onClick={() => navigate('/map')}>
            Mở bản đồ tương tác ↗
          </button>
        </div>

        <div className="hue-cta-compass" aria-hidden="true">
          <div>✳</div>
          <span>DISCOVER HUE</span>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="hue-footer">
        <div>
          <strong>HUẾ<span>GO</span></strong>
          <p>Khám phá di sản. Lưu giữ trải nghiệm.</p>
        </div>

        <div className="hue-footer-links">
          <Link to="/home">Trang chủ</Link>
          <Link to="/map">Bản đồ</Link>
          <Link to="/admin/login">Quản trị</Link>
        </div>

        <p>© 2026 HUẾ GO · Dự án du lịch thông minh</p>
      </footer>
    </div>
  );
}
