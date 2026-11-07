import React, { useEffect, useRef, useState } from 'react';
import { usePoiStore } from '../stores/poiStore';
import { getNarration, getNarrationAudioUrl, LANGUAGE_CODES } from '../data/narrationSamples';
import './AudioPlayerBar.css';

const UI_TEXT = {
  vi: { narration:'THUYẾT MINH DI SẢN', listen:'Nghe thuyết minh', pause:'Tạm dừng', resume:'Tiếp tục', stop:'Dừng', close:'Đóng trình phát', loading:'Nội dung đang cập nhật cho ngôn ngữ này.', browser:'Giọng đọc trình duyệt', audio:'Bản ghi âm', unsupported:'Trình duyệt không hỗ trợ đọc văn bản.', noText:'Chưa có nội dung thuyết minh cho ngôn ngữ này.', noVoice:'Thiết bị chưa có giọng đọc phù hợp. Vui lòng cài thêm giọng hoặc chọn ngôn ngữ khác.', speechError:'Không thể phát giọng đọc trên thiết bị này.', audioFallback:'Không tải được bản ghi âm. Đang thử giọng đọc trình duyệt.', audioError:'Lỗi phát bản ghi âm.', resumeError:'Không thể tiếp tục phát âm thanh.', language:'Ngôn ngữ', ready:'Sẵn sàng', nowPlaying:'Đang phát', isPaused:'Đã tạm dừng' },
  en: { narration:'HERITAGE AUDIO GUIDE', listen:'Listen to guide', pause:'Pause', resume:'Resume', stop:'Stop', close:'Close audio player', loading:'Narration is not yet available in this language.', browser:'Browser voice', audio:'Audio recording', unsupported:'Your browser does not support speech synthesis.', noText:'No narration is available in this language.', noVoice:'No matching voice is installed. Please install one or choose another language.', speechError:'Unable to play this voice on your device.', audioFallback:'Audio could not be loaded. Trying browser speech.', audioError:'Unable to play the audio recording.', resumeError:'Unable to resume audio.', language:'Language', ready:'Ready', nowPlaying:'Playing', isPaused:'Paused' },
  zh: { narration:'景点语音导览', listen:'收听讲解', pause:'暂停', resume:'继续播放', stop:'停止', close:'关闭播放器', loading:'此语言的讲解内容正在更新。', browser:'浏览器语音', audio:'录音', unsupported:'浏览器不支持语音朗读。', noText:'暂无此语言的讲解内容。', noVoice:'设备尚未安装相应语音，请安装或选择其他语言。', speechError:'无法在此设备上播放语音。', audioFallback:'录音无法加载，正在尝试浏览器朗读。', audioError:'录音播放失败。', resumeError:'无法继续播放。', language:'语言', ready:'准备就绪', nowPlaying:'播放中', isPaused:'已暂停' },
  ja: { narration:'史跡音声ガイド', listen:'ガイドを再生', pause:'一時停止', resume:'再開', stop:'停止', close:'プレーヤーを閉じる', loading:'この言語の案内は準備中です。', browser:'ブラウザ音声', audio:'録音音声', unsupported:'このブラウザは音声読み上げに対応していません。', noText:'この言語の案内はまだありません。', noVoice:'対応する音声がありません。音声を追加するか、別の言語を選択してください。', speechError:'この端末では音声を再生できません。', audioFallback:'録音を読み込めません。ブラウザの読み上げを試します。', audioError:'録音を再生できません。', resumeError:'再生を再開できません。', language:'言語', ready:'準備完了', nowPlaying:'再生中', isPaused:'一時停止中' },
  ko: { narration:'문화유산 오디오 가이드', listen:'해설 듣기', pause:'일시정지', resume:'계속 듣기', stop:'정지', close:'플레이어 닫기', loading:'이 언어의 해설을 준비 중입니다.', browser:'브라우저 음성', audio:'녹음 음성', unsupported:'브라우저가 음성 읽기를 지원하지 않습니다.', noText:'이 언어의 해설이 아직 없습니다.', noVoice:'해당 언어의 음성이 설치되지 않았습니다. 음성을 설치하거나 다른 언어를 선택하세요.', speechError:'이 기기에서 음성을 재생할 수 없습니다.', audioFallback:'녹음 파일을 불러올 수 없어 브라우저 음성을 시도합니다.', audioError:'녹음 파일을 재생할 수 없습니다.', resumeError:'재생을 계속할 수 없습니다.', language:'언어', ready:'준비 완료', nowPlaying:'재생 중', isPaused:'일시정지됨' },
};
const LANGUAGE_LABELS = {vi:'Tiếng Việt', en:'English', zh:'中文', ja:'日本語', ko:'한국어'};

export default function AudioPlayerBar() {
  const activePoi = usePoiStore(s => s.activePoi);
  const setActivePoi = usePoiStore(s => s.setActivePoi);
  const currentLanguage = usePoiStore(s => s.currentLanguage);
  const lang = UI_TEXT[currentLanguage] ? currentLanguage : 'vi';
  const t = UI_TEXT[lang];
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const playingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mode, setMode] = useState('');
  const [message, setMessage] = useState('');
  const narrationText = getNarration(activePoi, lang);

  const stopPlayback = () => {
    playingRef.current = false;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); audioRef.current.load(); }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPlaying(false);
    setPaused(false);
  };

  useEffect(() => {
    // Stop old narration whenever the selected POI or language changes.
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.removeAttribute('src'); }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    playingRef.current = false;
    setPlaying(false); setPaused(false); setMode(''); setMessage('');
  }, [activePoi?.id, currentLanguage]);

  useEffect(() => () => {
    audioRef.current?.pause();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  if (!activePoi) return null;

  const speak = () => {
    if (!('speechSynthesis' in window)) { setMessage(t.unsupported); return; }
    if (!narrationText) { setMessage(t.noText); return; }
    const preferred = LANGUAGE_CODES[lang] || 'vi-VN';
    const available = window.speechSynthesis.getVoices();
    const voice = available.find(v => v.lang.toLowerCase() === preferred.toLowerCase())
      || available.find(v => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
    if (!voice) { setMessage(t.noVoice); return; }
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.lang = preferred;
    utterance.voice = voice;
    utterance.rate = 0.95;
    utteranceRef.current = utterance;
    utterance.onend = () => {
      if (utteranceRef.current === utterance) { playingRef.current = false; setPlaying(false); setPaused(false); }
    };
    utterance.onerror = (event) => {
      if (utteranceRef.current !== utterance) return;
      if (event.error === 'canceled' || event.error === 'interrupted') return;
      playingRef.current = false; setPlaying(false); setPaused(false); setMessage(t.speechError);
    };
    setMode('speech'); playingRef.current = true; setPlaying(true); setPaused(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const audioUrlForLanguage = () => {
    const managedUrl = getNarrationAudioUrl(activePoi, lang);
    if (managedUrl) return managedUrl;
    if (activePoi.audioUrls && typeof activePoi.audioUrls === 'object') return activePoi.audioUrls[lang];
    return lang === 'vi' ? activePoi.audioUrl : null;
  };

  const play = async () => {
    stopPlayback(); setMessage('');
    const url = audioUrlForLanguage();
    if (url && audioRef.current) {
      audioRef.current.src = url;
      try {
        await audioRef.current.play();
        setMode('audio'); playingRef.current = true; setPlaying(true); setPaused(false);
        return;
      } catch { setMessage(t.audioFallback); }
    }
    speak();
  };
  const pause = () => {
    if (mode === 'audio') audioRef.current?.pause();
    else if ('speechSynthesis' in window) window.speechSynthesis.pause();
    setPaused(true);
  };
  const resume = async () => {
    if (mode === 'audio') {
      try { await audioRef.current?.play(); setPaused(false); }
      catch { setMessage(t.resumeError); }
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.resume(); setPaused(false);
    }
  };
  const close = () => { stopPlayback(); setActivePoi(null); };
  const status = playing ? (paused ? t.isPaused : t.nowPlaying) : t.ready;
  return (
    <section className="hue-audio-player" aria-label={t.narration}>
      <audio ref={audioRef} onEnded={() => {playingRef.current=false;setPlaying(false);setPaused(false);}}
        onError={() => { if (mode === 'audio') { playingRef.current=false;setPlaying(false);setMessage(t.audioError); } }}/>
      <div className="hue-audio-header">
        <span className="hue-audio-symbol" aria-hidden="true">🎧</span>
        <div className="hue-audio-heading">
          <span className="hue-audio-overline">{t.narration}</span>
          <h3>{activePoi.name}</h3>
        </div>
        <button type="button" className="hue-audio-close" onClick={close} aria-label={t.close} title={t.close}>✕</button>
      </div>
      <p className="hue-audio-description">{narrationText || t.loading}</p>
      <div className="hue-audio-footer">
        <div className="hue-audio-buttons">
          {!playing ? <button className="hue-audio-btn hue-audio-btn-primary" type="button" onClick={play}>▶ {t.listen}</button> : <>
            <button className="hue-audio-btn hue-audio-btn-primary" type="button" onClick={paused ? resume : pause}>{paused ? '▶' : '⏸'} {paused ? t.resume : t.pause}</button>
            <button className="hue-audio-btn hue-audio-btn-secondary" type="button" onClick={stopPlayback}>■ {t.stop}</button>
          </>}
        </div>
        <span className="hue-audio-status"><span className={`hue-audio-status-dot ${playing && !paused ? 'is-playing' : ''}`}/>{status}</span>
      </div>
      <div className="hue-audio-meta">
        <span>🌐 {LANGUAGE_LABELS[lang]}</span>
        {mode && <span>• {mode === 'audio' ? t.audio : t.browser}</span>}
      </div>
      {message && <p className="hue-audio-alert" role="status">{message}</p>}
    </section>
  );
}
