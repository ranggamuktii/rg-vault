import { create } from 'zustand';
import api from '../services/api';

export interface Link {
  id: number;
  user_id: number;
  url: string;
  title: string | null;
  description: string | null;
  favicon_url: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface LinkState {
  links: Link[];
  isLoading: boolean;
  error: string | null;
  fetchLinks: (search?: string, category?: string) => Promise<void>;
  createLink: (data: { url: string; title?: string; description?: string; category?: string }) => Promise<void>;
  updateLink: (id: number, data: { url: string; title?: string; description?: string; category?: string }) => Promise<void>;
  deleteLink: (id: number) => Promise<void>;
}

export const useLinkStore = create<LinkState>((set, get) => ({
  links: [],
  isLoading: false,
  error: null,

  fetchLinks: async (search, category) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);

      const response = await api.get(`/links?${params.toString()}`);
      console.log('Links API response:', response.data); // Debug log

      const linksData = response.data.data || response.data;
      set({
        links: Array.isArray(linksData) ? linksData : [],
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch links:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch links',
        isLoading: false,
        links: [],
      });
    }
  },

  createLink: async (data) => {
    try {
      console.log('Creating link:', data); // Debug log
      const response = await api.post('/links', data);
      console.log('Create link response:', response.data); // Debug log

      const newLink = response.data;
      set({ links: [newLink, ...get().links] });
    } catch (error: any) {
      console.error('Failed to create link:', error);
      throw new Error(error.response?.data?.message || 'Failed to create link');
    }
  },

  updateLink: async (id, data) => {
    try {
      console.log('Updating link:', id, data); // Debug log
      const response = await api.put(`/links/${id}`, data);
      console.log('Update link response:', response.data); // Debug log

      const updatedLink = response.data;
      set({
        links: get().links.map((link) => (link.id === id ? updatedLink : link)),
      });
    } catch (error: any) {
      console.error('Failed to update link:', error);
      throw new Error(error.response?.data?.message || 'Failed to update link');
    }
  },

  deleteLink: async (id) => {
    try {
      console.log('Deleting link:', id); // Debug log
      await api.delete(`/links/${id}`);
      set({
        links: get().links.filter((link) => link.id !== id),
      });
    } catch (error: any) {
      console.error('Failed to delete link:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete link');
    }
  },
}));
