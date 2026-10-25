// src/stores/authStore.js
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  userRole: null, // 'admin', 'owner', hoặc null
  
  // Hàm đăng nhập (sau này sẽ gọi API thực tế)
  login: (role) => set({ isAuthenticated: true, userRole: role }),
  
  // Hàm đăng xuất
  logout: () => set({ isAuthenticated: false, userRole: null }),
}));