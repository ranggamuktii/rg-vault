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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchNotes(searchTerm);
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, fetchNotes]);

  const selectedIndex = useMemo(() => (selectedNoteId == null ? -1 : notes.findIndex((n) => n.id === selectedNoteId)), [selectedNoteId, notes]);
  const selectedNote = selectedIndex >= 0 ? notes[selectedIndex] : null;

  const openEditor = (note?: Note) => {
    if (note) {
      setEditingNote(note);
      setValue('title', note.title);
      setValue('content', note.content);
      setValue('tags', note.tags?.join(', ') || '');
    } else {
      setEditingNote(null);
      reset();
    }
    setIsPreviewOpen(false);
    setIsEditorOpen(true);
  };

  const closePanel = useCallback(() => {
    setIsEditorOpen(false);
    setIsPreviewOpen(false);
    setEditingNote(null);
    reset();
  }, [reset]);

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
      } else {
        await createNote(payload);
        toast.success('Note created successfully!');
      }
      closePanel();
    } catch {
      toast.error('Something went wrong!');
    }
  };

  const onCardClick = (note: Note) => {
    setSelectedNoteId(note.id);
    setIsEditorOpen(false);
    setIsPreviewOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteNote(id);
        toast.success('Note deleted successfully!');
        if (selectedNoteId === id) closePanel();
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

  const panelOpen = isEditorOpen || isPreviewOpen;

  return (
    <MainLayout>
      <div className={`lg:grid gap-8 ${panelOpen ? 'lg:grid-cols-[1fr_600px]' : 'lg:grid-cols-[1fr_0px]'}`}>
        {/* LEFT: Notes List */}
        <div className="space-y-8 min-w-0">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-normal text-gray-900">Notes</h1>
            <p className="text-gray-600 mt-1">Capture and organize your thoughts</p>
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
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         transition-all"
            />
          </div>

          {/* Notes Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Note Card */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => openEditor()}
                onKeyDown={(e) => (e.key === 'Enter' ? openEditor() : null)}
                className={`
                  bg-white rounded-2xl border border-dashed border-gray-300 ring-1 ring-gray-950/5
                  flex flex-col items-center justify-center text-gray-500
                  transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
                  hover:-translate-y-0.5 hover:scale-[1.01] hover:border-blue-300 hover:text-blue-600
                  cursor-pointer animate-fadeIn
                  ${panelOpen ? 'md:col-span-2 lg:col-span-3 p-6' : 'p-5'}
                `}
                style={{ animationDelay: `0ms` }}
              >
                <PlusIcon className="h-8 w-8 mb-2" />
                <span className="font-medium">Add Note</span>
              </div>

              {/* Notes */}
              {notes.map((note, idx) => (
                <div
                  key={note.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onCardClick(note)}
                  onKeyDown={(e) => (e.key === 'Enter' ? onCardClick(note) : null)}
                  className={`
                    bg-white rounded-2xl border border-gray-100 ring-1 ring-gray-950/5
                    transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
                    hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-md
                    cursor-pointer group focus:outline-none animate-fadeIn
                    ${panelOpen ? 'md:col-span-2 lg:col-span-3 p-6' : 'p-5'}
                  `}
                  style={{ animationDelay: `${(idx + 1) * 60}ms` }} // stagger
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900 truncate flex-1 mr-3">{note.title}</h3>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditor(note);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(note.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-4 leading-relaxed">
                    {note.content.substring(0, 200)}
                    {note.content.length > 200 && '...'}
                  </p>
                  {note.tags?.length > 0 && (
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
        </div>

        {/* RIGHT: Sidebar */}
        <aside
          className={`
            sticky top-[64px]
            h-[calc(100vh-64px)]
            bg-white border-l border-gray-100
            transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
            ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
            overflow-y-auto rounded-2xl
          `}
        >
          {isEditorOpen && (
            <div className=" p-6 animate-fadeIn">
              <h3 className="text-xl font-medium text-gray-900 mb-6">{editingNote ? 'Edit Note' : 'Create New Note'}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input {...register('title', { required: 'Title is required' })} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  {errors.title && <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea {...register('content', { required: 'Content is required' })} rows={8} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                  {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <input {...register('tags')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={closePanel} className="px-6 py-3 bg-gray-100 rounded-xl">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl">
                    {editingNote ? 'Update Note' : 'Create Note'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {isPreviewOpen && selectedNote && (
            <div className="p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <button onClick={goPrev} className="p-2 rounded-lg hover:bg-gray-50">
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button onClick={goNext} className="p-2 rounded-lg hover:bg-gray-50">
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
                <button onClick={closePanel} className="p-2 rounded-lg hover:bg-gray-50">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{selectedNote.title}</h2>
              <div className="text-xs text-gray-500 mb-4">
                {new Date(selectedNote.created_at).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              {selectedNote.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedNote.tags.map((tag, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <article className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">{selectedNote.content}</article>
              <div className="flex gap-3 mt-8">
                <button onClick={() => openEditor(selectedNote)} className="px-4 py-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition">
                  <PencilIcon className="w-4 h-4 inline mr-1" /> Edit
                </button>
                <button onClick={() => handleDelete(selectedNote.id)} className="px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition">
                  <TrashIcon className="w-4 h-4 inline mr-1" /> Delete
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </MainLayout>
  );
};

export default Notes;
