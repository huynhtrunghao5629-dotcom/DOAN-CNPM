
import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const normalize = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();

export default function ImperialMapHeader({ language = 'vi' }) {
  return (
    <header className="regal-map-header">
      <Link className="regal-map-header__brand" to="/home">
        <span className="regal-map-header__logo">H</span>
        <span>
          <strong>HUẾ <em>GO</em></strong>
          <small>DI SẢN CỐ ĐÔ</small>
        </span>
      </Link>

      <nav className="regal-map-header__nav" aria-label="Điều hướng bản đồ">
        <Link to="/home">Khám phá</Link>
        <span className="is-active" aria-current="page">Bản đồ</span>
        <Link to="/destinations">Điểm đến</Link>
      </nav>

      <span className="regal-map-header__language">
        ◉ {String(language).toUpperCase()} · HUẾ
      </span>
    </header>
  );
}

export function ImperialMapSearch({ pois = [], onSelect }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return [];

    return pois
      .filter(p =>
        normalize(`${p.name} ${p.address || ''} ${p.category || ''}`)
          .includes(term)
      )
      .slice(0, 7);
  }, [query, pois]);

  const choose = poi => {
    onSelect(poi);
    setQuery('');
  };

  return (
    <section className="regal-map-search">
      <label htmlFor="regal-map-query">TÌM KIẾM DI SẢN</label>
      <div className="regal-map-search__input">
        <span aria-hidden="true">⌕</span>
        <input
          id="regal-map-query"
          type="search"
          autoComplete="off"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Tên di tích, địa điểm..."
        />
        {query && (
          <button type="button" aria-label="Xóa tìm kiếm"
            onClick={() => setQuery('')}>×</button>
        )}
      </div>

      {query.trim() && (
        <div className="regal-map-search__results" role="list">
          {results.length ? results.map(poi => (
            <button type="button" key={poi.id}
              onClick={() => choose(poi)} role="listitem">
              <span className="regal-map-search__poi-icon">⌖</span>
              <span>
                <strong>{poi.name}</strong>
                <small>{poi.category || 'Di tích lịch sử'}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          )) : (
            <p>Không tìm thấy địa điểm phù hợp.</p>
          )}
        </div>
      )}
    </section>
  );
}
