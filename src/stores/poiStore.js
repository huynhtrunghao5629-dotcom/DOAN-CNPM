import { create } from 'zustand';

export const usePoiStore = create((set) => ({
  // Vị trí GPS của du khách
  userPosition: null,
  setUserPosition: (pos) => set({ userPosition: pos }),

  // Danh sách các điểm tham quan
  pois: [],
  setPois: (pois) => set({ pois }),

  // Điểm đang được chọn hoặc đang phát thuyết minh
  activePoi: null,
  setActivePoi: (poi) => set({ activePoi: poi }),

  // Ngôn ngữ đang chọn
  currentLanguage: 'vi',
  setCurrentLanguage: (lang) => set({ currentLanguage: lang }),
}));