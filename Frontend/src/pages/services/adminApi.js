import { apiRequest } from './api';
import { userApi } from './userApi';

const toDto = (poi) => ({
  name: poi.name,
  category: poi.category || 'Di tích lịch sử',
  description: poi.description || '',
  address: poi.address || '',
  latitude: Number(poi.lat ?? poi.latitude),
  longitude: Number(poi.lng ?? poi.longitude),
  images: Array.isArray(poi.images) ? poi.images : [],
});

export const adminApi = {
  getPois: () => userApi.getAllPois(),
  createPoi: (poi) => apiRequest('/api/v1/pois', { method: 'POST', auth: true, body: toDto(poi) }),
  updatePoi: (id, poi) => apiRequest(`/api/v1/pois/${encodeURIComponent(id)}`, {
    method: 'PUT', auth: true, body: { ...toDto(poi), isActive: poi.isActive ?? true },
  }),
  deletePoi: (id) => apiRequest(`/api/v1/pois/${encodeURIComponent(id)}`, { method: 'DELETE', auth: true }),
};
