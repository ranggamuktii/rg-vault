import { create } from 'zustand';
import api from '../services/api';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface NoteState {
  notes: Note[];
  isLoading: boolean;
  error: string | null;
  fetchNotes: (search?: string) => Promise<void>;
  createNote: (data: { title: string; content: string; tags: string[] }) => Promise<void>;
  updateNote: (id: number, data: { title: string; content: string; tags: string[] }) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  isLoading: false,
  error: null,

  fetchNotes: async (search) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);

      const response = await api.get(`/notes?${params.toString()}`);

      const notesData = response.data.data || response.data;
      set({
        notes: Array.isArray(notesData) ? notesData : [],
        isLoading: false,
      });
    } catch (error: any) {
      console.error('Failed to fetch notes:', error);
      set({
        error: error.response?.data?.message || 'Failed to fetch notes',
        isLoading: false,
        notes: [],
      });
    }
  },

  createNote: async (data) => {
    try {
      const response = await api.post('/notes', data);

      const newNote = response.data;
      set({ notes: [newNote, ...get().notes] });
    } catch (error: any) {
      console.error('Failed to create note:', error);
      throw new Error(error.response?.data?.message || 'Failed to create note');
    }
  },

  updateNote: async (id, data) => {
    try {
      const response = await api.put(`/notes/${id}`, data);

      const updatedNote = response.data;
      set({
        notes: get().notes.map((note) => (note.id === id ? updatedNote : note)),
      });
    } catch (error: any) {
      console.error('Failed to update note:', error);
      throw new Error(error.response?.data?.message || 'Failed to update note');
    }
  },

  deleteNote: async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      set({
        notes: get().notes.filter((note) => note.id !== id),
      });
    } catch (error: any) {
      console.error('Failed to delete note:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete note');
    }
  },
}));
