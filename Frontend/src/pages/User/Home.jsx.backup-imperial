
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
<article
className="regal-card regal-reveal"
  style={{ '--rg-delay': `${(index % 3) * 85}ms` }}
>      <div className="regal-card__photo">
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
  
const [navScrolled, setNavScrolled] = useState(false);

useEffect(() => {
  const updateNavbar = () => setNavScrolled(window.scrollY > 35);

  updateNavbar();

  window.addEventListener('scroll', updateNavbar, { passive: true });

  return () => window.removeEventListener('scroll', updateNavbar);
}, []);
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


const heroPoi = useMemo(() => {
  return (
    pois.find(p => /dai noi|ngo mon|kinh thanh/.test(normalize(p.name))) ||
    pois.find(p => normalize(p.name).includes('chua thien mu')) ||
    pois[0] ||
    null
  );
}, [pois]);

const [heroImageStep, setHeroImageStep] = useState(0);

useEffect(() => {
  setHeroImageStep(0);
}, [heroPoi?.id]);

const heroImage = heroPoi
  ? heroImageStep === 0
    ? getPoiImage(heroPoi)
    : heroImageStep === 1
      ? getCuratedPhoto(heroPoi.name)
      : FALLBACK_IMAGE
  : '';
const toggleFavorite = (id) => {
  setFavorites((current) => {
    const exists = current.some(x => String(x) === String(id));

    const updated = exists
      ? current.filter(x => String(x) !== String(id))
      : [...current, id];

    localStorage.setItem('hue_favorites', JSON.stringify(updated));
    return updated;
  });
};
// Hiện nội dung nhẹ nhàng khi người dùng cuộn trang.
// Không chạy hiệu ứng nếu thiết bị yêu cầu giảm chuyển động.
useEffect(() => {
  const root = document.querySelector('.regal-home');
  if (!root) return;

  const elements = root.querySelectorAll('.regal-reveal');

  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    elements.forEach(element => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px 40px 0px'
    }
  );

  elements.forEach(element => observer.observe(element));

  return () => observer.disconnect();
}, [filtered, limit]);
// Hiện nội dung nhẹ nhàng khi người dùng cuộn trang.
// Không chạy hiệu ứng nếu thiết bị yêu cầu giảm chuyển động.
useEffect(() => {
  const root = document.querySelector('.regal-home');
  if (!root) return;

  const elements = root.querySelectorAll('.regal-reveal');

  if (
    !('IntersectionObserver' in window) ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    elements.forEach(element => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.08,
      rootMargin: '0px 0px 40px 0px'
    }
  );

  elements.forEach(element => observer.observe(element));

  return () => observer.disconnect();
}, [filtered, limit]);
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
<header className={`regal-navbar ${navScrolled ? 'is-scrolled' : ''}`}>
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

<form className="regal-nav-search" role="search" onSubmit={(event) => {
  event.preventDefault();
  scrollToPlaces();
}}>
  <span aria-hidden="true">⌕</span>
  <input
    type="search"
    value={query}
    onChange={(event) => { setQuery(event.target.value); setLimit(6); }}
    aria-label="Tìm di tích ở Huế"
    placeholder="Tìm di tích, địa điểm, trải nghiệm..."
  />
</form>
<Link to="/map" className="regal-nav-map-mobile">⌖ Bản đồ</Link><h2>Những điểm đến <em>tiêu biểu tại Huế</em></h2>

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


{/* Ảnh di tích phủ toàn chiều ngang */}
<div className="regal-hero__visual" aria-hidden="true">
<div className="regal-hero__arch">
  <img
    className="regal-hero__photo"
    src="/images/heritage/dai-noi.jpg"
    alt="Cổng Ngọ Môn tại Đại Nội Huế"
    onError={(event) => {
      const el = event.currentTarget;
      if (el.dataset.fallback === '1') return;
      el.dataset.fallback = '1';
      el.src = heroPoi ? getPoiImage(heroPoi) : FALLBACK_IMAGE;
    }}
  />
  <span className="regal-hero__image-label">HUẾ · VIỆT NAM</span>
</div>
</div>

{/* Họa tiết mây cung đình và cổng Ngọ Môn */}
<div className="regal-hero__ornaments" aria-hidden="true">

  <svg className="regal-cloud regal-cloud--top"
    viewBox="0 0 310 120" fill="none">
    <g stroke="currentColor" strokeWidth="2">
      <path d="M0 72H43C30 58 35 37 53 33C64 16 91 18 102 35C120 29 135 43 131 58H154C174 58 174 82 154 82H91"/>
      <path d="M0 85H55C70 85 76 69 66 61C55 51 41 60 44 71"/>
      <path d="M101 44C117 30 144 39 143 58"/>
      <path d="M157 73H235C252 73 256 56 242 50C225 43 217 54 217 61"/>
      <path d="M170 89H281C294 89 299 79 289 72"/>
      <path d="M200 46C209 29 236 29 247 44C264 38 280 50 277 63"/>
    </g>
  </svg>

  <svg className="regal-cloud regal-cloud--bottom"
    viewBox="0 0 310 120" fill="none">
    <g stroke="currentColor" strokeWidth="2">
      <path d="M0 72H43C30 58 35 37 53 33C64 16 91 18 102 35C120 29 135 43 131 58H154C174 58 174 82 154 82H91"/>
      <path d="M0 85H55C70 85 76 69 66 61C55 51 41 60 44 71"/>
      <path d="M101 44C117 30 144 39 143 58"/>
      <path d="M157 73H235C252 73 256 56 242 50C225 43 217 54 217 61"/>
      <path d="M170 89H281C294 89 299 79 289 72"/>
    </g>
  </svg>

  {/* Minh họa cổng Ngọ Môn cách điệu */}
  <svg className="regal-ngo-mon"
    viewBox="0 0 800 340" fill="none">
    <g stroke="currentColor" strokeWidth="2.3"
      strokeLinecap="round" strokeLinejoin="round">

      <path d="M45 292H755V320H45Z"/>
      <path d="M75 215H725V292H75Z"/>

      <path d="M125 292V257Q125 231 151 231Q177 231 177 257V292"/>
      <path d="M240 292V257Q240 231 266 231Q292 231 292 257V292"/>
      <path d="M352 292V249Q352 217 400 217Q448 217 448 249V292"/>
      <path d="M508 292V257Q508 231 534 231Q560 231 560 257V292"/>
      <path d="M623 292V257Q623 231 649 231Q675 231 675 257V292"/>

      <path d="M65 207H735M80 198H720"/>
      <path d="M145 192V140H655V192"/>
      <path d="M126 140H674M165 131H635"/>

      <path d="M95 141L155 104H645L705 141Z"/>
      <path d="M95 141Q135 143 155 129H645Q665 143 705 141"/>
      <path d="M160 111H640"/>

      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${185 + i * 54} 144V190`}/>
      ))}

      <path d="M275 103V60H525V103"/>
      <path d="M260 60H540"/>
      <path d="M232 63L292 25H508L568 63Z"/>
      <path d="M232 63Q268 66 292 52H508Q532 66 568 63"/>
      <path d="M305 32H495"/>

      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${310 + i * 45} 65V101`}/>
      ))}

      <path d="M395 25L400 10L405 25"/>
      <path d="M292 25L280 16M508 25L520 16"/>
      <path d="M25 326H775M5 334H795"/>
    </g>
  </svg>
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
<div className="regal-section-heading regal-reveal">
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
<div className="regal-journey__copy regal-reveal">
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
