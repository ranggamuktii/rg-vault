import { create } from 'zustand';
import api from '../services/api';

export interface FileItem {
  id: number;
  user_id: number;
  filename: string;
  storage_url: string;
  storage_id: string | null;
  mimetype: string;
  size: number;
  category: string | null;
  created_at: string;
  updated_at: string;
}

interface FileState {
  files: FileItem[];
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  fetchFiles: (search?: string, category?: string, type?: string) => Promise<void>;
  uploadFile: (file: File, category?: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  isLoading: false,
  isUploading: false,
  error: null,

  fetchFiles: async (search, category, type) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (type) params.append('type', type);

      const response = await api.get(`/files?${params.toString()}`);

      const filesData = response.data.data || response.data;
      set({
        files: Array.isArray(filesData) ? filesData : [],
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch files:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch files',
        isLoading: false,
        files: [],
      });
    }
  },

  uploadFile: async (file, category) => {
    set({ isUploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (category) formData.append('category', category);

      const response = await api.post('/files/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newFile = response.data;
      set({
        files: [newFile, ...get().files],
        isUploading: false,
      });
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      set({ isUploading: false });
      throw new Error(error.response?.data?.message || 'Failed to upload file');
    }
  },

  deleteFile: async (id) => {
    try {
      await api.delete(`/files/${id}`);
      set({
        files: get().files.filter((file) => file.id !== id),
      });
    } catch (error: any) {
      console.error('Failed to delete file:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete file');
    }
  },
}));
