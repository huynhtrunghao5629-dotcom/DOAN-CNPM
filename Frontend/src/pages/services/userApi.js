import { apiRequest } from './api';

export const normalizePoi = (poi) => ({
  ...poi,
  id: String(poi.id ?? poi._id ?? ''),
  lat: Number(poi.latitude ?? poi.lat),
  lng: Number(poi.longitude ?? poi.lng),
  radius: Number(poi.radius ?? 150), // Backend chưa có radius: giá trị hiển thị thử nghiệm
  category: poi.category || 'Di tích lịch sử',
  description: poi.description || '',
  images: Array.isArray(poi.images) ? poi.images : [],
});

export const userApi = {
  async getAllPois({ category, search, pageSize = 50 } = {}) {
    const result = [];
    for (let page = 1; page <= 100; page++) {
      const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (category) query.set('category', category);
      if (search) query.set('search', search);
      const response = await apiRequest(`/api/v1/pois?${query}`);
      if (!Array.isArray(response?.data)) throw new Error('API POI không trả về data dạng mảng.');
      result.push(...response.data);
      if (page >= Number(response.totalPages || 1)) return result.map(normalizePoi);
    }
    throw new Error('Phân trang POI vượt quá 100 trang.');
  },
  async getPoi(id) {
    const response = await apiRequest(`/api/v1/pois/${encodeURIComponent(id)}`);
    return normalizePoi(response?.data ?? response);
  },
};
