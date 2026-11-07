// Một nguồn xác định ảnh thống nhất cho Trang chủ, Bottom Sheet và Trang chi tiết.
// Ưu tiên ảnh upload trong MongoDB, rồi ảnh di tích đã đóng gói Offline.
export const FALLBACK_IMAGE = '/images/hue-heritage-placeholder.svg';

const CURATED = [
  { match: /dai noi|hoang thanh|ngo mon/, file: 'dai-noi.jpg' },
  { match: /thien mu/, file: 'thien-mu.jpg' },
  { match: /tu duc/, file: 'tu-duc.jpg' },
  { match: /khai dinh/, file: 'khai-dinh.jpg' },
  { match: /minh mang/, file: 'minh-mang.jpg' },
  { match: /gia long/, file: 'gia-long.jpg' },
  { match: /nam giao/, file: 'nam-giao.jpg' },
];

function normalizeName(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();
}

export function getCuratedPhoto(name) {
  const match = CURATED.find(item => item.match.test(normalizeName(name)));
  return match ? `/images/heritage/${match.file}` : FALLBACK_IMAGE;
}

function imageUrl(entry) {
  const value = typeof entry === 'string' ? entry :
    (entry && typeof entry === 'object' ? (entry.url ?? entry.imageUrl ?? entry.src) : '');
  if (typeof value !== 'string') return '';
  const url = value.trim();
  if (!url || /^(javascript:|data:|blob:|file:)/i.test(url) || url.includes('..')) return '';
  if (/^https?:\/\//i.test(url) || /^\/(?!\/)/.test(url)) return url;
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith('//')) return '';
  return '/' + url.replace(/^\.\/?/, '').replace(/^\/+/, '');
}

export function getPoiGallery(poi) {
  if (!poi) return [FALLBACK_IMAGE];
  const candidates = [
    ...(Array.isArray(poi.images) ? poi.images : []),
    poi.imageUrl, poi.image, poi.thumbnailUrl,
  ];
  const fromDatabase = [...new Set(candidates.map(imageUrl).filter(Boolean))];
  const curated = getCuratedPhoto(poi.name);
  return [...new Set([...fromDatabase, ...(curated !== FALLBACK_IMAGE ? [curated] : [])])].length
    ? [...new Set([...fromDatabase, ...(curated !== FALLBACK_IMAGE ? [curated] : [])])]
    : [FALLBACK_IMAGE];
}

export function getPoiImage(poi) { return getPoiGallery(poi)[0]; }
