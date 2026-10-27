import { create } from 'zustand';
import { userApi } from '../pages/services/userApi';
import { getOfflinePOIs, saveOfflinePOIs } from '../services/db';

let pendingFetch = null;

export const usePoiStore = create((set, get) => ({
  pois: [],
  activePoi: null,
  userPosition: null,
  currentLanguage: 'vi',
  loading: false,
  error: null,
  source: null,
  loaded: false,
  setPois: (pois) => set({ pois }),
  setActivePoi: (activePoi) => set({ activePoi }),
  clearActivePoi: () => set({ activePoi: null }),
  setUserPosition: (userPosition) => set({ userPosition }),
  setCurrentLanguage: (currentLanguage) => set({ currentLanguage }),
  fetchPois: async ({ force = false } = {}) => {
    if (pendingFetch) return pendingFetch;
    if (!force && get().loaded) return get().pois;

    set({ loading: true, error: null });
    pendingFetch = (async () => {
      // When offline, never make a pointless network request. Read the real
      // POIs previously saved from the API, not hard-coded demo records.
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        let cached = [];
        try {
          cached = await getOfflinePOIs('vi');
        } catch (e) {
          console.warn('Không đọc được POI trong IndexedDB:', e);
        }
        const existing = get().pois;
        const pois = cached.length ? cached : existing;
        const hasData = pois.length > 0;
        set({
          pois,
          source: cached.length ? 'offline' : get().source,
          loaded: hasData,
          loading: false,
          error: hasData ? null : 'Chưa có dữ liệu POI ngoại tuyến. Hãy mở /map khi có mạng để lưu dữ liệu trước.',
        });
        return pois;
      }

      try {
        const pois = await userApi.getAllPois();
        if (!Array.isArray(pois)) throw new Error('Danh sách POI không hợp lệ.');
        // Wait for IndexedDB to finish, so switching Offline immediately after
        // load does not race with the asynchronous write.
        try {
          await saveOfflinePOIs(pois, 'vi');
        } catch (e) {
          console.warn('Chưa lưu được POI ngoại tuyến:', e);
        }
        set({ pois, source: 'api', loaded: true, loading: false, error: null });
        return pois;
      } catch (e) {
        let offline = [];
        try {
          offline = await getOfflinePOIs('vi');
        } catch (cacheError) {
          console.warn('Không đọc được POI trong IndexedDB:', cacheError);
        }
        const pois = offline.length ? offline : get().pois;
        const hasData = pois.length > 0;
        set({
          pois,
          source: offline.length ? 'offline' : get().source,
          loaded: hasData,
          loading: false,
          error: hasData ? null : e.message,
        });
        if (!hasData) throw e;
        return pois;
      }
    })();
    try {
      return await pendingFetch;
    } finally {
      pendingFetch = null;
    }
  },
  getPoiById: (id) => get().pois.find((p) => String(p.id) === String(id)),
}));
