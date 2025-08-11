import { create } from 'zustand';
import api from '../services/api';

interface DashboardStats {
  totalNotes: number;
  totalLinks: number;
  totalFiles: number;
  totalStorage: number;
  recentNotes: any[];
  recentLinks: any[];
  recentFiles: any[];
}

interface DashboardState {
  stats: DashboardStats | null;
  isLoading: boolean;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  isLoading: false,

  fetchStats: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/dashboard/stats');
      set({ stats: response.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      set({ isLoading: false });
    }
  },
}));
