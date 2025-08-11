import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useNoteStore } from '../store/noteStore';
import type { Note } from '../types';

interface NoteForm {
  title: string;
  content: string;
  tags: string;
}

const Notes: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Preview state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<number | null>(null);

  const { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote } = useNoteStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteForm>();

  // Fetch notes on component mount
  useEffect(() => {
    console.log('Notes component mounted, fetching notes...');
    fetchNotes();
  }, [fetchNotes]);

  // Handle search with debounce
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      console.log('Searching notes with term:', searchTerm);
      fetchNotes(searchTerm);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, fetchNotes]);

  // -------- Helpers
  const selectedIndex = useMemo(() => (selectedNoteId == null ? -1 : notes.findIndex((n) => n.id === selectedNoteId)), [selectedNoteId, notes]);
  const selectedNote = selectedIndex >= 0 ? notes[selectedIndex] : null;

  const openModal = (note?: Note) => {
    if (note) {
      console.log('Editing note:', note);
      setEditingNote(note);
      setValue('title', note.title);
      setValue('content', note.content);
      setValue('tags', note.tags?.join(', ') || '');
    } else {
      console.log('Creating new note');
      setEditingNote(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    reset();
  };

  const onSubmit = async (data: NoteForm) => {
    try {
      const payload = {
        title: data.title,
        content: data.content,
        tags: data.tags
          ? data.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };

      if (editingNote) {
        await updateNote(editingNote.id, payload);
        toast.success('Note updated successfully!');
        // sinkronkan preview kalau lagi terbuka untuk note yang sama
        if (selectedNoteId === editingNote.id) {
          setSelectedNoteId(editingNote.id); // trigger reselect
        }
      } else {
        await createNote(payload);
        toast.success('Note created successfully!');
      }

      closeModal();
    } catch (error: unknown) {
      const maybeMsg = typeof error === 'object' && error && 'response' in error && (error as any)?.response?.data?.message;
      toast.error(typeof maybeMsg === 'string' ? maybeMsg : 'Something went wrong!');
    }
  };

  const onCardClick = (note: Note) => {
    setSelectedNoteId(note.id);
    setIsPreviewOpen(true);
  };

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    // jangan reset selectedNoteId supaya bisa reopen cepat; atau set null kalau mau bersih
  }, []);

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        toast.success('Note deleted successfully!');
      } catch {
        toast.error('Failed to delete note');
      }
    }
  };

  const goPrev = useCallback(() => {
    if (!notes.length || selectedIndex < 0) return;
    const prev = (selectedIndex - 1 + notes.length) % notes.length;
    setSelectedNoteId(notes[prev].id);
  }, [notes, selectedIndex]);

  const goNext = useCallback(() => {
    if (!notes.length || selectedIndex < 0) return;
    const next = (selectedIndex + 1) % notes.length;
    setSelectedNoteId(notes[next].id);
  }, [notes, selectedIndex]);

  // Esc / Arrow keys in preview
  useEffect(() => {
    if (!isPreviewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePreview();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isPreviewOpen, closePreview, goPrev, goNext]);

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal text-gray-900">Notes</h1>
            <p className="text-gray-600 mt-1">Capture and organize your thoughts</p>
          </div>
          <button onClick={() => openModal()} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Notes Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              <div
                key={note.id}
                role="button"
                tabIndex={0}
                onClick={() => onCardClick(note)}
                onKeyDown={(e) => (e.key === 'Enter' ? onCardClick(note) : null)}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900 truncate flex-1 mr-3">{note.title}</h3>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal(note);
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="Edit note"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete note"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-4 leading-relaxed">
                  {note.content.substring(0, 200)}
                  {note.content.length > 200 && '...'}
                </p>

                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">+{note.tags.length - 3}</span>}
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                  {new Date(note.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && notes.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-6">Create your first note to get started</p>
            <button onClick={() => openModal()} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create your first note
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 z-40 transition-opacity backdrop-blur-sm" onClick={closeModal} />

            <div className="inline-block relative z-50 align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <h3 className="text-xl font-medium text-gray-900 mb-6">{editingNote ? 'Edit Note' : 'Create New Note'}</h3>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        {...register('title', { required: 'Title is required' })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter note title"
                      />
                      {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        {...register('content', { required: 'Content is required' })}
                        rows={8}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Write your note here..."
                      />
                      {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input
                        {...register('tags')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="work, personal, ideas (comma separated)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">
                    {editingNote ? 'Update Note' : 'Create Note'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Preview Slide-Over */}
      {isPreviewOpen && selectedNote && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity" onClick={closePreview} />
          {/* Panel */}
          <aside className="absolute inset-y-0 right-0 w-full sm:max-w-lg bg-white shadow-2xl border-l border-gray-100 transform transition-transform translate-x-0" aria-modal="true" role="dialog">
            <header className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goPrev();
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Previous"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goNext();
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100"
                  title="Next"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <button onClick={closePreview} className="p-2 rounded-lg hover:bg-gray-100" title="Close">
                <XMarkIcon className="w-6 h-6 text-gray-700" />
              </button>
            </header>

            <div className="px-6 py-6 space-y-6 overflow-y-auto h-full">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-2xl font-semibold text-gray-900 leading-snug">{selectedNote.title}</h2>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => {
                      openModal(selectedNote);
                      // biar preview tetap kebuka atau tutup, pilih salah satu:
                      setIsPreviewOpen(false);
                    }}
                    className="px-3 py-2 text-sm rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                    title="Edit"
                  >
                    <PencilIcon className="w-4 h-4 inline align-[-2px] mr-1" />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(selectedNote.id)} className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 hover:bg-red-100" title="Delete">
                    <TrashIcon className="w-4 h-4 inline align-[-2px] mr-1" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                {new Date(selectedNote.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>

              {selectedNote.tags && selectedNote.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag, i) => (
                    <span key={i} className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <article className="prose prose-sm max-w-none text-gray-800">
                {/* render apa adanya, pertahankan newline */}
                <pre className="whitespace-pre-wrap font-sans text-[0.95rem] leading-7 text-gray-800">{selectedNote.content}</pre>
              </article>
            </div>
          </aside>
        </div>
      )}
    </MainLayout>
  );
};

export default Notes;
