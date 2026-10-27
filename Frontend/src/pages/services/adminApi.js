import { apiRequest } from './api';
import { userApi } from './userApi';

// Giữ nguyên dữ liệu POI khi gửi về Backend, đặc biệt là thuyết minh đa ngôn ngữ.
const toDto = (poi) => ({
  name: poi.name,
  category: poi.category || 'Di tích lịch sử',
  description: poi.description || '',
  address: poi.address || '',
  latitude: Number(poi.lat ?? poi.latitude),
  longitude: Number(poi.lng ?? poi.longitude),
  images: Array.isArray(poi.images) ? poi.images : [],
  radius: Number(poi.radius ?? 50),
  narrations: Object.fromEntries(
    Object.entries(poi.narrations || {}).map(([lang, item]) => [
      lang,
      {
        text: String(item?.text ?? ''),
        audioUrl: String(item?.audioUrl ?? ''),
      },
    ])
  ),
  ...(typeof poi.narration === 'string' ? { narration: poi.narration } : {}),
});

export const adminApi = {
  getPois: () => userApi.getAllPois(),
  createPoi: (poi) => apiRequest('/api/v1/pois', {
    method: 'POST', auth: true, body: toDto(poi),
  }),
  updatePoi: (id, poi) => apiRequest(`/api/v1/pois/${encodeURIComponent(id)}`, {
    method: 'PUT', auth: true,
    body: { ...toDto(poi), isActive: poi.isActive ?? true },
  }),
  uploadPoiImage: (id, file) => {
    const fd = new FormData(); fd.append('file', file);
    return apiRequest(`/api/v1/pois/${encodeURIComponent(id)}/upload-image`, {
      method: 'POST', auth: true, body: fd,
    });
  },
  deletePoi: (id) => apiRequest(`/api/v1/pois/${encodeURIComponent(id)}`, {
    method: 'DELETE', auth: true,
  }),
};
