import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePoiStore } from '../../stores/poiStore';
import { userApi } from '../services/userApi';

export default function POIDetail() {
  const { id } = useParams();
  const pois = usePoiStore((state) => state.pois);
  const fetchPois = usePoiStore((state) => state.fetchPois);
  const [directPoi, setDirectPoi] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loadingPoi, setLoadingPoi] = useState(true);
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

    const text = poi.narration ||
      `Chào mừng bạn đến với ${poi.name}. ${poi.description || 'Thông tin lịch sử đang được cập nhật.'}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const vietnameseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith('vi'));
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

  if (!poi && loadingPoi) return <main style={styles.page}>Đang tải thông tin di tích...</main>;
  if (!poi) {
    return (
      <main style={styles.page}>
        <div style={{ ...styles.card, padding: 32 }}>
          <h1>Không tìm thấy địa điểm</h1>
          <p style={styles.description}>
            {loadError || 'Không tìm thấy di tích này trong dữ liệu API.'}
          </p>
          <Link to="/home" style={styles.button}>Về trang chủ</Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <Link to="/home" style={styles.back}>← Quay lại khám phá Huế</Link>

        <article style={styles.card}>
          <div style={styles.banner}>
            <span style={styles.eyebrow}>KHÁM PHÁ CỐ ĐÔ HUẾ</span>
            <h1 style={styles.heading}>{poi.name}</h1>
          </div>

          <div style={styles.content}>
            <h2 style={styles.sectionTitle}>Giới thiệu di tích</h2>
            <p style={styles.description}>
              {poi.description || 'Thông tin địa điểm đang được cập nhật.'}
            </p>

            <section style={styles.narrationBox} aria-label="Thuyết minh lịch sử">
              <div>
                <h3 style={styles.narrationTitle}>🎧 Thuyết minh lịch sử</h3>
                <p style={styles.narrationHint}>
                  Nghe giới thiệu về di tích bằng giọng đọc tiếng Việt.
                </p>
              </div>
              <button
                type="button"
                onClick={isSpeaking ? stopNarration : startNarration}
                style={styles.narrationButton}
                aria-pressed={isSpeaking}
              >
                {isSpeaking ? '⏹ Dừng thuyết minh' : '🔊 Nghe thuyết minh'}
              </button>
            </section>

            <h2 style={styles.sectionTitle}>Thông tin vị trí</h2>
            <div style={styles.infoGrid}>
              <div style={styles.info}>
                <strong>Vĩ độ</strong>
                <p>{poi.lat}</p>
              </div>
              <div style={styles.info}>
                <strong>Kinh độ</strong>
                <p>{poi.lng}</p>
              </div>
              <div style={styles.info}>
                <strong>Bán kính Geofence</strong>
                <p>{poi.radius || 100} mét</p>
              </div>
            </div>

            <div style={styles.actions}>
              <Link to="/map" style={styles.button}>🗺️ Mở bản đồ du lịch</Link>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${poi.lat},${poi.lng}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.outlineButton}
              >
                📍 Xem vị trí Google Maps
              </a>
            </div>
          </div>
        </article>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '40px 20px',
    background: '#f8f6f0',
    fontFamily: 'Arial, sans-serif',
    color: '#243b36',
  },
  container: { maxWidth: 1000, margin: '0 auto' },
  back: {
    display: 'inline-block',
    marginBottom: 24,
    color: '#176b57',
    textDecoration: 'none',
    fontWeight: 600,
  },
  card: {
    background: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    boxShadow: '0 15px 40px rgba(20,50,40,0.08)',
  },
  banner: {
    minHeight: 230,
    padding: 35,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #174f45, #4f8b75)',
    color: '#fff',
  },
  eyebrow: { fontSize: 12, fontWeight: 700, letterSpacing: 2 },
  heading: { fontSize: 'clamp(30px, 5vw, 48px)', margin: '18px 0 0' },
  content: { padding: 32 },
  sectionTitle: { margin: '10px 0 16px', fontSize: 24 },
  description: { fontSize: 16, lineHeight: 1.9, color: '#63756c', marginBottom: 24 },
  narrationBox: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    padding: 22,
    margin: '22px 0 32px',
    background: '#edf7f1',
    border: '1px solid #cfe6d9',
    borderRadius: 14,
  },
  narrationTitle: { fontSize: 19, margin: '0 0 8px', color: '#176b57' },
  narrationHint: { color: '#63756c', fontSize: 14, lineHeight: 1.6, margin: 0 },
  narrationButton: {
    background: '#176b57',
    color: '#fff',
    border: 'none',
    padding: '14px 22px',
    borderRadius: 10,
    cursor: 'pointer',
    fontWeight: 600,
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 16,
    marginTop: 28,
  },
  info: { padding: 18, background: '#f3f7f4', borderRadius: 12 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 30 },
  button: {
    display: 'inline-block',
    padding: '13px 20px',
    color: '#fff',
    background: '#176b57',
    borderRadius: 8,
    textDecoration: 'none',
  },
  outlineButton: {
    display: 'inline-block',
    padding: '12px 20px',
    color: '#176b57',
    background: '#fff',
    border: '1px solid #176b57',
    borderRadius: 8,
    textDecoration: 'none',
  },
};
