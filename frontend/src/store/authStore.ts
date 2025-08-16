import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api from '../services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  _setHasHydrated: (v: boolean) => void; // internal
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,

      _setHasHydrated: (v) => set({ hasHydrated: v }),

      // Server akan set HttpOnly cookie di sini
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });

          if (data.access_token) {
            localStorage.setItem('token', data.access_token);
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await api.post('/auth/logout'); // server hapus cookie
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = localStorage.getItem('token');
          if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          const { data } = await api.get<{ user: User }>('/auth/me');
          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('token');
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      // kita *tidak* menyimpan token apa pun, hanya cache user & flag
      partialize: (s) => ({
        user: s.user,
        isAuthenticated: s.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) console.error('Error rehydrating auth store', error);
        state?._setHasHydrated(true);
        // opsional: langsung validasi lagi
        // void state?.checkAuth();
      },
    }
  )
);
