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
      try {
        const pois = await userApi.getAllPois();
        set({ pois, source: 'api', loaded: true, loading: false, error: null });
        saveOfflinePOIs(pois, 'vi').catch(console.warn);
        return pois;
      } catch (e) {
        let offline = [];
        try { offline = await getOfflinePOIs('vi'); } catch (cacheError) { console.warn(cacheError); }
        // Không dùng dữ liệu mẫu giả làm dữ liệu thật khi API lỗi.
        set({
          pois: offline.length ? offline : get().pois,
          source: offline.length ? 'offline' : get().source,
          loaded: offline.length > 0,
          loading: false,
          error: e.message,
        });
        if (!offline.length) throw e;
        return offline;
      } finally { pendingFetch = null; }
    })();
    return pendingFetch;
  },
  getPoiById: (id) => get().pois.find((p) => String(p.id) === String(id)),
}));
