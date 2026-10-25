import React, { useEffect, useRef, useState } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { getNarration, LANGUAGE_CODES } from '../data/narrationSamples';

export default function AudioPlayerBar() {
  const activePoi = usePoiStore(s => s.activePoi);
  const setActivePoi = usePoiStore(s => s.setActivePoi);
  const currentLanguage = usePoiStore(s => s.currentLanguage);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState('');
  const [message, setMessage] = useState('');
  const [voices, setVoices] = useState([]);
  const narrationText = getNarration(activePoi, currentLanguage);

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const refresh = () => setVoices(window.speechSynthesis.getVoices());
    refresh();
    window.speechSynthesis.addEventListener?.('voiceschanged', refresh);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', refresh);
  }, []);

  useEffect(() => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlaying(false); setPaused(false); setMessage(''); setMode('');
  }, [activePoi?.id, currentLanguage]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  if (!activePoi) return null;

  const stop = () => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null; setPlaying(false); setPaused(false);
  };

  const speak = () => {
    if (!('speechSynthesis' in window)) { setMessage('Trình duyệt không hỗ trợ đọc văn bản.'); return; }
    if (!narrationText) { setMessage('Chưa có nội dung thuyết minh cho ngôn ngữ này.'); return; }
    const preferred = LANGUAGE_CODES[currentLanguage] || 'vi-VN';
    const allVoices = window.speechSynthesis.getVoices();
    const voice = allVoices.find(v => v.lang.toLowerCase() === preferred.toLowerCase())
      || allVoices.find(v => v.lang.toLowerCase().startsWith(currentLanguage.toLowerCase()));
    if (!voice) {
      setMessage(`Máy chưa có giọng đọc ${preferred}. Hãy cài giọng tương ứng hoặc chọn ngôn ngữ khác.`);
      return;
    }
    const u = new SpeechSynthesisUtterance(narrationText);
    u.lang = preferred; u.voice = voice; u.rate = 0.95;
    utteranceRef.current = u;
    u.onend = () => { if (utteranceRef.current === u) { setPlaying(false); setPaused(false); } };
    u.onerror = e => { if (utteranceRef.current === u && e.error !== 'canceled' && e.error !== 'interrupted') { setPlaying(false); setPaused(false); setMessage('Không thể phát giọng đọc trên thiết bị này.'); } };
    setMode('Giọng đọc trình duyệt'); setPlaying(true); setPaused(false);
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
  };

  const audioUrlForLanguage = () => {
    if (activePoi.audioUrls && typeof activePoi.audioUrls === 'object') return activePoi.audioUrls[currentLanguage];
    return currentLanguage === 'vi' ? activePoi.audioUrl : null;
  };

  const play = async () => {
    setMessage(''); stop();
    const url = audioUrlForLanguage();
    if (url && audioRef.current) {
      audioRef.current.src = url;
      try { await audioRef.current.play(); setMode('Audio'); setPlaying(true); return; }
      catch { setMessage('Không tải được audio; đang thử giọng đọc trình duyệt.'); }
    }
    speak();
  };
  const pause = () => {
    if (mode === 'Audio') audioRef.current?.pause();
    else window.speechSynthesis?.pause();
    setPaused(true);
  };
  const resume = () => {
    if (mode === 'Audio') audioRef.current?.play().catch(()=>setMessage('Không thể tiếp tục phát audio.'));
    else window.speechSynthesis?.resume();
    setPaused(false);
  };
  return (
    <div style={{position:'absolute',bottom:18,left:'50%',transform:'translateX(-50%)',zIndex:30,background:'white',padding:16,borderRadius:16,width:'min(460px,calc(100% - 36px))',boxShadow:'0 8px 30px #0004',color:'#222'}}>
      <audio ref={audioRef} onEnded={()=>{setPlaying(false);setPaused(false);}} onError={()=>{if(mode==='Audio')setMessage('Lỗi phát tệp audio.');}} />
      <button type="button" onClick={()=>{stop();setActivePoi(null);}} style={{float:'right'}}>✕</button>
      <strong>🎧 {activePoi.name}</strong>
      <p style={{fontSize:13,lineHeight:1.5,maxHeight:110,overflowY:'auto'}}>{narrationText || 'Nội dung đang cập nhật cho ngôn ngữ này.'}</p>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
        {!playing && <button type="button" onClick={play} style={{background:'#176b57',color:'#fff',border:0,borderRadius:8,padding:'10px 14px',cursor:'pointer'}}>▶ Nghe thuyết minh</button>}
        {playing && <>
          <button type="button" onClick={paused?resume:pause}>{paused?'▶ Tiếp tục':'⏸ Tạm dừng'}</button>
          <button type="button" onClick={stop}>⏹ Dừng</button>
        </>}
        <small>{mode}</small>
      </div>
      {message && <p role="status" style={{fontSize:12,color:'#a33'}}>{message}</p>}
    </div>
  );
}
