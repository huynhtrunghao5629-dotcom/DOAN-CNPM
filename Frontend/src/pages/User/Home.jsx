
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { FALLBACK_IMAGE, getCuratedPhoto, getPoiImage } from '../../utils/poiImages';
import './Home.css';

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase()
    .trim();

function readFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('hue_favorites') || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function HeritageCard({ poi, index, saved, onFavorite }) {
  const [failed, setFailed] = useState(0);
  const primaryImage = getPoiImage(poi);
  const curatedImage = getCuratedPhoto(poi.name);
  const fallbackImage =
    curatedImage && curatedImage !== primaryImage
      ? curatedImage
      : FALLBACK_IMAGE;

  useEffect(() => setFailed(0), [primaryImage, poi.id]);

  const src =
    failed === 0
      ? primaryImage
      : failed === 1
        ? fallbackImage
        : FALLBACK_IMAGE;

  return (
    <article className="regal-card">
      <div className="regal-card__photo">
        <img
          src={src}
          alt={poi.name}
          loading={index < 3 ? 'eager' : 'lazy'}
          onError={() => setFailed(v => Math.min(v + 1, 2))}
        />

        <span className="regal-card__number">
          DI SẢN {String(index + 1).padStart(2, '0')}
        </span>

        <button
          type="button"
          className={`regal-card__heart ${saved ? 'is-saved' : ''}`}
          onClick={() => onFavorite(poi.id)}
          aria-pressed={saved}
          aria-label={saved ? `Bỏ yêu thích ${poi.name}` : `Lưu ${poi.name}`}
        >
          {saved ? '♥' : '♡'}
        </button>
      </div>

      <div className="regal-card__body">
        <div className="regal-card__category">
          <span className="regal-ornament">✦</span>
          {poi.category || 'Di tích lịch sử'}
        </div>

        <h3>{poi.name}</h3>

        <p>
          {poi.description ||
            'Khám phá một nét đẹp độc đáo trong không gian di sản Cố đô Huế.'}
        </p>

        <div className="regal-card__footer">
          <span>⌖ {poi.address || 'Thành phố Huế'}</span>
          <Link to={`/poi/${encodeURIComponent(poi.id)}`}>
            Khám phá <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const location = useLocation();

  const pois = usePoiStore(s => s.pois);
  const fetchPois = usePoiStore(s => s.fetchPois);
  const loading = usePoiStore(s => s.loading);
  const error = usePoiStore(s => s.error);
  const source = usePoiStore(s => s.source);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [favorites, setFavorites] = useState(readFavorites);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    fetchPois({ force: true }).catch(console.warn);
  }, [fetchPois]);

  useEffect(() => {
    if (location.pathname !== '/destinations') return;
    const timer = setTimeout(() => {
      document.getElementById('regal-destinations')
        ?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  const categories = useMemo(
    () => ['all', ...new Set(pois.map(p => p.category).filter(Boolean))],
    [pois]
  );

  const filtered = useMemo(() => {
    const term = normalize(query);
    return pois.filter(p => {
      const matchesText =
        !term ||
        normalize(`${p.name} ${p.description || ''} ${p.address || ''}`)
          .includes(term);

      const matchesCategory =
        category === 'all' || p.category === category;

      const matchesSaved =
        !favoritesOnly || favorites.some(id => String(id) === String(p.id));

      return matchesText && matchesCategory && matchesSaved;
    });
  }, [pois, query, category, favoritesOnly, favorites]);

  const heritageCount = pois.filter(p =>
    normalize(p.category).includes('di tich')
  ).length;
const heroPoi =
  pois.find(p => normalize(p.name).includes('dai noi')) ||
  pois.find(p => normalize(p.name).includes('chua thien mu')) ||
  pois[0];
  const toggleFavorite = id => {
    setFavorites(current => {
      const exists = current.some(x => String(x) === String(id));
      const next = exists
        ? current.filter(x => String(x) !== String(id))
        : [...current, id];

      localStorage.setItem('hue_favorites', JSON.stringify(next));
      return next;
    });
  };

  const scrollToPlaces = () =>
    document.getElementById('regal-destinations')
      ?.scrollIntoView({ behavior: 'smooth' });

  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setFavoritesOnly(false);
    setLimit(6);
  };

  return (
    <main className="regal-home">
      <header className="regal-navbar">
        <Link to="/home" className="regal-brand">
          <span className="regal-brand__emblem">H</span>
          <span>
            <strong>HUẾ <i>GO</i></strong>
            <small>KHÁM PHÁ DI SẢN CỐ ĐÔ</small>
          </span>
        </Link>

        <nav className="regal-navbar__links" aria-label="Điều hướng chính">
          <Link to="/home" className="is-current">Khám phá</Link>
          <Link to="/map">Bản đồ</Link>
          <Link to="/destinations">Điểm đến</Link>
        </nav>

        <Link to="/map" className="regal-navbar__cta">
          ⌖ &nbsp; Bản đồ du lịch <span>↗</span>
        </Link>
      </header>

      <section className="regal-hero">
        <div className="regal-hero__inner">
          <div className="regal-hero__copy">
            <span className="regal-eyebrow">
              <span>✦</span> CỐ ĐÔ HUẾ <span>✦</span>
            </span>

            <h1>
              Huế – Điểm hẹn
              <br />
              <span>di sản ngàn đời</span>
            </h1>

            <p className="regal-hero__quote">
              Giữa lòng di sản, chạm vào tinh hoa Cố đô.
            </p>

            <p className="regal-hero__description">
              Từ mái ngói hoàng cung trầm mặc, dòng Hương êm đềm
              đến những câu chuyện của triều Nguyễn. Mỗi điểm đến
              mở ra một hành trình khám phá vẻ đẹp xứ Huế.
            </p>

            <div className="regal-hero__actions">
              <button type="button" onClick={scrollToPlaces}
                className="regal-button regal-button--gold">
                Khám phá ngay <span>↗</span>
              </button>

              <Link to="/map" className="regal-button regal-button--outline">
                ⌖ Xem bản đồ
              </Link>
            </div>

            <div className="regal-hero__signature">
              <span className="regal-signature-line" />
              DI SẢN • VĂN HÓA • TRẢI NGHIỆM
            </div>
          </div>

          <div className="regal-hero__visual" aria-label="Hình ảnh Cố đô Huế">
<div className="regal-hero__arch">
  {heroPoi && (
    <img
      className="regal-hero__photo"
      src={getPoiImage(heroPoi)}
      alt={`Di sản Huế - ${heroPoi.name}`}
      onError={(e) => {
        const img = e.currentTarget;
        img.onerror = null;
        img.src = getCuratedPhoto(heroPoi.name) || FALLBACK_IMAGE;
      }}
    />
  )}

  <span className="regal-hero__image-label">
    HUẾ, VIỆT NAM
  </span>
</div>
            
            <span className="regal-hero__visual-orbit" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section className="regal-stats" aria-label="Thông tin HUẾ GO">
        <div className="regal-stats__item">
          <span className="regal-stats__icon">◇</span>
          <div>
            <strong>{String(pois.length).padStart(2, '0')}</strong>
            <p>Điểm đến khám phá</p>
          </div>
        </div>

        <div className="regal-stats__item">
          <span className="regal-stats__icon">♜</span>
          <div>
            <strong>{String(heritageCount).padStart(2, '0')}</strong>
            <p>Di tích lịch sử</p>
          </div>
        </div>

        <div className="regal-stats__item">
          <span className="regal-stats__icon">◎</span>
          <div>
            <strong>05</strong>
            <p>Ngôn ngữ thuyết minh</p>
          </div>
        </div>
      </section>

      <section id="regal-destinations" className="regal-destinations">
        <div className="regal-section-heading">
          <div>
            <span className="regal-eyebrow regal-eyebrow--dark">
              ✦ KHÁM PHÁ TINH HOA CỐ ĐÔ
            </span>
            <h2>
              Những điểm đến
              <br />
              <em>tiêu biểu tại Huế.</em>
            </h2>
          </div>
          <p>
            Mỗi mái ngói, cổng thành và khu lăng tẩm đều kể một
            câu chuyện riêng. Chọn điểm đến và bắt đầu hành trình
            khám phá cùng HUẾ GO.
          </p>
        </div>

        <div className="regal-search">
          <span className="regal-search__icon">⌕</span>
          <input
            type="search"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setLimit(6);
            }}
            placeholder="Bạn muốn khám phá nơi nào ở Huế?"
            aria-label="Tìm kiếm địa điểm ở Huế"
          />
          {query && (
            <button type="button" className="regal-search__clear"
              onClick={() => setQuery('')}
              aria-label="Xóa nội dung tìm kiếm">×</button>
          )}
          <button type="button" onClick={scrollToPlaces}
            className="regal-search__submit">
            Tìm điểm đến <span>↗</span>
          </button>
        </div>

        <div className="regal-filters">
          <div className="regal-filters__categories">
            {categories.map(item => (
              <button key={item} type="button"
                className={`regal-filter ${category === item ? 'is-active' : ''}`}
                aria-pressed={category === item}
                onClick={() => {setCategory(item); setLimit(6);}}>
                {item === 'all' ? '✦ Tất cả di tích' : item}
              </button>
            ))}
          </div>
          <button type="button"
            className={`regal-filter regal-filter--favorite ${favoritesOnly ? 'is-active' : ''}`}
            aria-pressed={favoritesOnly}
            onClick={() => {setFavoritesOnly(v => !v); setLimit(6);}}>
            ♡ Yêu thích ({favorites.length})
          </button>
        </div>

        <div className="regal-results">
          <span>
            <strong>{filtered.length}</strong> điểm đến được tìm thấy
          </span>
          <span>DI SẢN CỐ ĐÔ HUẾ</span>
        </div>

        {loading && pois.length === 0 && (
          <div className="regal-grid" role="status" aria-label="Đang tải địa điểm">
            {Array.from({length: 6}, (_, i) => (
              <div key={i} className="regal-skeleton" />
            ))}
          </div>
        )}

        {error && (
          <p className="regal-alert" role="status">
            {source === 'offline'
              ? 'Đang hiển thị dữ liệu ngoại tuyến. '
              : 'Chưa thể cập nhật dữ liệu. '}
            {error}
          </p>
        )}

        {(!loading || pois.length > 0) && (
          filtered.length ? (
            <>
              <div className="regal-grid">
                {filtered.slice(0, limit).map((poi, index) => (
                  <HeritageCard
                    key={poi.id}
                    poi={poi}
                    index={index}
                    saved={favorites.some(id => String(id) === String(poi.id))}
                    onFavorite={toggleFavorite}
                  />
                ))}
              </div>

              {limit < filtered.length && (
                <div className="regal-more">
                  <button type="button" onClick={() => setLimit(v => v + 6)}>
                    Xem thêm điểm đến ↓
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="regal-empty">
              <h3>Chưa tìm thấy điểm đến phù hợp</h3>
              <p>Hãy thử một từ khóa hoặc bộ lọc khác.</p>
              <button type="button" onClick={clearFilters}>
                Xem tất cả điểm đến
              </button>
            </div>
          )
        )}
      </section>

      <section className="regal-journey">
        <div className="regal-journey__copy">
          <span>✦ HÀNH TRÌNH DI SẢN</span>
          <h2>Cả Cố đô Huế,<br /><em>trong tầm tay bạn.</em></h2>
          <p>
            Khám phá địa điểm trên bản đồ tương tác,
            sử dụng GPS và lắng nghe thuyết minh đa ngôn ngữ.
          </p>
          <Link to="/map" className="regal-button regal-button--gold">
            Mở bản đồ tương tác ↗
          </Link>
        </div>
        <div className="regal-journey__seal" aria-hidden="true">
          <span>✦</span>
          <small>HUẾ GO</small>
        </div>
      </section>

      <footer className="regal-footer">
        <div>
          <strong>HUẾ <span>GO</span></strong>
          <p>Khám phá di sản. Lưu giữ trải nghiệm.</p>
        </div>
        <nav aria-label="Điều hướng cuối trang">
          <Link to="/home">Trang chủ</Link>
          <Link to="/map">Bản đồ</Link>
          <Link to="/destinations">Điểm đến</Link>
          <Link to="/admin/login">Quản trị</Link>
        </nav>
        <small>© 2026 HUẾ GO · Du lịch thông minh Huế</small>
      </footer>
    </main>
  );
}
