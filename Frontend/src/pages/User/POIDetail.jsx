import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { userApi } from '../services/userApi';
import { getNarration, LANGUAGE_CODES } from '../../data/narrationSamples';
import { getPoiGallery, getCuratedPhoto, FALLBACK_IMAGE } from '../../utils/poiImages';
import './POIDetail.css';

export default function POIDetail() {
  const { id } = useParams();
  const pois = usePoiStore((state) => state.pois);
  const fetchPois = usePoiStore((state) => state.fetchPois);
  const currentLanguage = usePoiStore(state => state.currentLanguage);
  const [directPoi, setDirectPoi] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingPoi, setLoadingPoi] = useState(true);
  const [galleryIndex, setGalleryIndex] = useState(0);
  useEffect(() => setGalleryIndex(0), [id]);
  const poi = pois.find((item) => String(item.id) === String(id)) || directPoi;

  useEffect(() => {
    let cancelled = false;
    setLoadingPoi(true);
    setDirectPoi(null);
    setLoadError('');
    (async () => {
      try {
        const all = await fetchPois();
        const found = all.find(p => String(p.id) === String(id));
        if (!found && /^[a-f0-9]{24}$/i.test(id)) {
          const result = await userApi.getPoi(id);
          if (!cancelled) setDirectPoi(result);
        }
      } catch (e) {
        if (!cancelled) setLoadError(e.message);
      } finally {
        if (!cancelled) setLoadingPoi(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, fetchPois]);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef(null);

  const stopNarration = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  };

  const startNarration = () => {
    if (!poi) return;
    if (!('speechSynthesis' in window)) {
      alert('Trình duyệt không hỗ trợ thuyết minh tự động.');
      return;
    }

    window.speechSynthesis.cancel();

    const text = getNarration(poi, currentLanguage);
    if (!text) { alert('Chưa có bài thuyết minh được biên tập cho ngôn ngữ đang chọn.'); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_CODES[currentLanguage] || 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const vietnameseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith(currentLanguage.toLowerCase()));
    if (vietnameseVoice) utterance.voice = vietnameseVoice;

    utterance.onend = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setIsSpeaking(false);
      }
    };
    utterance.onerror = () => {
      if (utteranceRef.current === utterance) {
        utteranceRef.current = null;
        setIsSpeaking(false);
      }
    };

    utteranceRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [id]);

  if (!poi && loadingPoi) return <main className="huego-detail-page"><div className="huego-detail-loading" role="status">Đang tải thông tin di tích...</div></main>;
  if (!poi) return (
    <main className="huego-detail-page"><div className="huego-detail-empty">
      <h1>Không tìm thấy địa điểm</h1>
      <p>{loadError || 'Không tìm thấy di tích này trong dữ liệu API hoặc bộ nhớ ngoại tuyến.'}</p>
      <Link to="/home" className="huego-detail-btn">Về trang chủ</Link>
    </div></main>
  );

  const gallery = getPoiGallery(poi);
  const selectedPhoto = gallery[Math.min(galleryIndex, gallery.length - 1)] || FALLBACK_IMAGE;
  const changePhoto = (next) => setGalleryIndex((next + gallery.length) % gallery.length);
  const handleImageError = (event) => {
    const img = event.currentTarget;
    const step = Number(img.dataset.fallbackStep || 0);
    img.dataset.fallbackStep = String(step + 1);
    const local = getCuratedPhoto(poi.name);
    if (step === 0 && local !== FALLBACK_IMAGE && !img.src.endsWith(local)) img.src = local;
    else if (step < 2 && !img.src.endsWith(FALLBACK_IMAGE)) img.src = FALLBACK_IMAGE;
  };
  return (
    <main className="huego-detail-page">
      <div className="huego-detail-wrap">
        <div className="huego-detail-topline">
          <Link to="/home" className="huego-detail-back">← Quay lại khám phá Huế</Link>
          <span className="huego-detail-breadcrumb">HUẾ GO / DI SẢN / CHI TIẾT</span>
        </div>
        <article className="huego-detail-card">
          <section className="huego-detail-hero" aria-label={`Hình ảnh ${poi.name}`}>
            <img key={`${poi.id}-${galleryIndex}`} className="huego-detail-cover" src={selectedPhoto} alt={`Ảnh di tích ${poi.name}`} onError={handleImageError} />
            <div className="huego-detail-gradient" aria-hidden="true" />
            <div className="huego-detail-hero-text">
              <span className="huego-detail-tag">✦ KHÁM PHÁ DI SẢN CỐ ĐÔ</span>
              <h1>{poi.name}</h1>
              <p>Khám phá câu chuyện lịch sử và vẻ đẹp riêng của vùng đất Huế.</p>
            </div>
            {gallery.length > 1 && <div className="huego-detail-hero-count">{galleryIndex + 1} / {gallery.length}</div>}
            {gallery.length > 1 && <div className="huego-detail-hero-nav">
              <button type="button" aria-label="Ảnh trước" onClick={() => changePhoto(galleryIndex - 1)}>‹</button>
              <button type="button" aria-label="Ảnh tiếp theo" onClick={() => changePhoto(galleryIndex + 1)}>›</button>
            </div>}
          </section>
          <div className="huego-detail-content">
            {gallery.length > 1 && <div className="huego-detail-thumbs" aria-label="Thư viện ảnh di tích">
              {gallery.map((src, i) => <button key={src} type="button" className={i === galleryIndex ? 'selected' : ''}
                aria-label={`Xem ảnh ${i + 1}`} aria-pressed={i === galleryIndex} onClick={() => setGalleryIndex(i)}>
                <img src={src} alt={`${poi.name} - ảnh ${i + 1}`} loading="lazy" onError={handleImageError}/>
              </button>)}
            </div>}
            <div className="huego-detail-columns">
              <div className="huego-detail-story">
                <span className="huego-detail-overline">DI SẢN VÀ CÂU CHUYỆN</span>
                <h2>Khám phá {poi.name}</h2>
                <p className="huego-detail-description">{poi.description || 'Thông tin giới thiệu địa điểm đang được cập nhật.'}</p>
                <section className="huego-detail-narration" aria-label="Thuyết minh lịch sử">
                  <div className="huego-detail-narration-icon" aria-hidden="true">🎧</div>
                  <div className="huego-detail-narration-copy">
                    <h3>Thuyết minh lịch sử</h3>
                    <p>Nghe câu chuyện di sản bằng ngôn ngữ đang chọn trong ứng dụng.</p>
                    <span className="huego-detail-language">🌐 {({vi:'Tiếng Việt',en:'English',zh:'中文',ja:'日本語',ko:'한국어'})[currentLanguage] || 'Tiếng Việt'}</span>
                  </div>
                  <button type="button" className="huego-detail-btn huego-detail-listen" onClick={isSpeaking ? stopNarration : startNarration} aria-pressed={isSpeaking}>
                    {isSpeaking ? '■ Dừng' : '▶ Nghe thuyết minh'}
                  </button>
                </section>
              </div>
              <aside className="huego-detail-aside" aria-label="Thông tin vị trí">
                <h2>Thông tin tham quan</h2>
                <div className="huego-detail-data"><span>📍 Địa chỉ</span><strong>{poi.address || 'Thành phố Huế, Việt Nam'}</strong></div>
                <div className="huego-detail-data"><span>◉ Bán kính nhận diện</span><strong>{poi.radius ?? 50} mét</strong></div>
                <div className="huego-detail-coordinates"><div><span>Vĩ độ</span><strong>{poi.lat}</strong></div><div><span>Kinh độ</span><strong>{poi.lng}</strong></div></div>
                <Link to={`/map?poi=${encodeURIComponent(poi.id)}`} className="huego-detail-btn huego-detail-map-btn">⌖ Xem vị trí trên bản đồ HUẾ GO</Link>
                <a className="huego-detail-external" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.lat},${poi.lng}`)}`} target="_blank" rel="noopener noreferrer">Xem vị trí trên Google Maps ↗</a>
                <p className="huego-detail-note">GPS và bản đồ ngoại tuyến hoạt động bằng dữ liệu đã lưu trên thiết bị.</p>
              </aside>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}
