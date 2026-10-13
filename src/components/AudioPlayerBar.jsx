import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePoiStore } from '../stores/poiStore';

export default function AudioPlayerBar() {
  const { activePoi, setActivePoi } = usePoiStore();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTier, setActiveTier] = useState('Tier 1: Audio Cache');

  // Hàm phát Fallback Tier 3 (giọng đọc trình duyệt)
  const playTier3Fallback = useCallback((text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'vi-VN';
      utterance.rate = 0.95;
      utterance.onstart = () => {
        setIsPlaying(true);
        setActiveTier('Tier 3: Browser TTS Fallback');
      };
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (!activePoi) {
      if (audioRef.current) audioRef.current.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    if (activePoi.audioUrl) {
      setActiveTier('Tier 1: Audio File');
      if (audioRef.current) {
        audioRef.current.src = activePoi.audioUrl;
        audioRef.current.play()
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Tự động chuyển Tier 3 nếu audio file không load được
            playTier3Fallback(activePoi.description);
          });
      }
    } else {
      playTier3Fallback(activePoi.description);
    }

    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, [activePoi, playTier3Fallback]);

  if (!activePoi) return null;

  const togglePlay = () => {
    if (activeTier.includes('Tier 3')) {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      }
      return;
    }

    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 480,
      backgroundColor: '#ffffff',
      borderRadius: 16,
      boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
      padding: '16px 20px',
      zIndex: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      border: '1px solid #e0e0e0'
    }}>
      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#8b0000', textTransform: 'uppercase' }}>
            🎧 {activeTier}
          </span>
          <h3 style={{ margin: '2px 0 0', fontSize: 16, color: '#111' }}>{activePoi.name}</h3>
        </div>
        <button
          onClick={() => setActivePoi(null)}
          style={{
            background: '#f0f0f0',
            border: 'none',
            borderRadius: '50%',
            width: 28,
            height: 28,
            cursor: 'pointer',
            fontSize: 14
          }}>✕</button>
      </div>

      <p style={{ margin: 0, fontSize: 13, color: '#444', lineHeight: 1.4 }}>
        {activePoi.description}
      </p>

      {/* Controller */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <button
          onClick={togglePlay}
          style={{
            backgroundColor: '#8b0000',
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '7px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
          {isPlaying ? '⏸ Tạm dừng' : '▶ Nghe thuyết minh'}
        </button>
        <span style={{ fontSize: 12, color: '#777' }}>
          Vùng kích hoạt: {activePoi.radius}m
        </span>
      </div>
    </div>
  );
}