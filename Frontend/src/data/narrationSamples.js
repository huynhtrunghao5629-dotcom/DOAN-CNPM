// Dữ liệu thuyết minh lấy từ MongoDB. Không dùng bản demo theo tên di tích.
export const LANGUAGE_CODES = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR' };
export function getNarration(poi, language = 'vi') {
  if (!poi) return '';
  const translated = poi.narrations?.[language];
  if (typeof translated === 'string') return translated.trim();
  if (typeof translated?.text === 'string') return translated.text.trim();
  if (language === 'vi' && typeof poi.narration === 'string') return poi.narration.trim();
  return '';
}
export function getNarrationAudioUrl(poi, language = 'vi') {
  const record = poi?.narrations?.[language];
  return typeof record?.audioUrl === 'string' ? record.audioUrl.trim() : '';
}
