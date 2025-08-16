'use client';

import type React from 'react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import JoditEditor from 'jodit-react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon, SparklesIcon, BookmarkIcon, StarIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
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
  const [editorContent, setEditorContent] = useState('');
  const [pinnedNotes, setPinnedNotes] = useState<Set<number>>(new Set());
  const [draggedNote, setDraggedNote] = useState<number | null>(null);

  const { notes, isLoading, fetchNotes, createNote, updateNote, deleteNote } = useNoteStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<NoteForm>();

  const editorConfig = useMemo(
    () =>
      ({
        readonly: false,
        placeholder: 'Start writing your thoughts...',
        height: 300,
        buttons: ['bold', 'italic', 'underline', '|', 'ul', 'ol', '|', 'link', '|', 'align', '|', 'undo', 'redo', '|', 'hr', 'eraser'],
        removeButtons: ['source', 'fullsize', 'about', 'outdent', 'indent', 'video', 'print', 'table', 'fontsize', 'brush', 'file'],
        showCharsCounter: false,
        showWordsCounter: false,
        askBeforePasteHTML: false,
        askBeforePasteFromWord: false,
      } as any),
    []
  );

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
      setEditorContent(note.content);
      setValue('tags', note.tags?.join(', ') || '');
    } else {
      setEditingNote(null);
      reset();
      setEditorContent('');
    }
    setIsPreviewOpen(false);
    setIsEditorOpen(true);
  };

  const closePanel = useCallback(() => {
    setIsEditorOpen(false);
    setIsPreviewOpen(false);
    setEditingNote(null);
    reset();
    setEditorContent('');
  }, [reset]);

  const onSubmit = async (data: NoteForm) => {
    try {
      const payload = {
        title: data.title,
        content: editorContent,
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

  const togglePin = (noteId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(noteId)) {
        newSet.delete(noteId);
        toast.success('Note unpinned');
      } else {
        newSet.add(noteId);
        toast.success('Note pinned');
      }
      return newSet;
    });
  };

  const handleDragStart = (e: React.DragEvent, noteId: number) => {
    setDraggedNote(noteId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetNoteId: number) => {
    e.preventDefault();
    if (draggedNote && draggedNote !== targetNoteId) {
      toast.success('Note position updated');
    }
    setDraggedNote(null);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      const aIsPinned = pinnedNotes.has(a.id);
      const bIsPinned = pinnedNotes.has(b.id);
      if (aIsPinned && !bIsPinned) return -1;
      if (!aIsPinned && bIsPinned) return 1;
      return 0;
    });
  }, [notes, pinnedNotes]);

  const panelOpen = isEditorOpen || isPreviewOpen;

  const getTagColor = (index: number) => {
    const colors = [
      'bg-purple-100 text-purple-700 border-purple-200', // Soft Lavender
      'bg-emerald-100 text-emerald-700 border-emerald-200', // Mint Green
      'bg-amber-100 text-amber-700 border-amber-200', // Pale Yellow
      'bg-rose-100 text-rose-700 border-rose-200', // Soft Pink
      'bg-blue-100 text-blue-700 border-blue-200', // Updated to use Modern Blue palette
    ];
    return colors[index % colors.length];
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className={`transition-all duration-700 ease-out ${panelOpen ? 'lg:grid lg:grid-cols-[1fr_800px] gap-12' : 'lg:grid-cols-[1fr_0px]'}`}>
            {/* LEFT: Notes List */}
            <div className="space-y-10 min-w-0">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-3">
                    <SparklesIcon className="w-8 h-8 text-blue-600" />
                    <h1 className={`font-bold text-slate-900 font-serif transition-all duration-300 ${panelOpen ? 'text-2xl' : 'text-4xl'}`}>Notes</h1>
                  </div>
                  <p className={`text-slate-600 leading-relaxed transition-all duration-300 ${panelOpen ? 'text-base' : 'text-lg'}`}>Capture and organize your thoughts in your personal knowledge vault</p>
                </div>
              </div>

              <div className={`relative transition-all duration-300 ${panelOpen ? 'max-w-md' : 'max-w-lg'}`}>
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search your notes..."
                  aria-label="Search notes"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-3xl
                             focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300
                             shadow-sm shadow-slate-900/5 transition-all duration-200
                             placeholder:text-slate-400 text-slate-700"
                />
              </div>

              {/* Notes Grid/List */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-200"></div>
                    <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent absolute top-0"></div>
                  </div>
                </div>
              ) : (
                <div className={`transition-all duration-500 ${panelOpen ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8'}`}>
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Add a new note"
                    onClick={() => openEditor()}
                    onKeyDown={(e) => (e.key === 'Enter' ? openEditor() : null)}
                    className={`
                      group relative bg-white/60 backdrop-blur-sm rounded-3xl border-2 border-dashed border-slate-300/60
                      flex items-center justify-center text-slate-500 transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] 
                      transform-gpu will-change-transform hover:-translate-y-2 hover:scale-[1.02] hover:border-blue-300 hover:text-blue-600
                      hover:bg-gradient-to-br hover:from-blue-50/80 hover:to-indigo-50/80 cursor-pointer animate-fadeIn 
                      shadow-sm hover:shadow-xl hover:shadow-blue-500/10
                      ${panelOpen ? 'h-20 px-8 flex-row gap-4' : 'min-h-[280px] p-8 flex-col'}
                    `}
                    style={{ animationDelay: `0ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className={`relative z-10 flex items-center ${panelOpen ? 'gap-4' : 'flex-col'}`}>
                      <div className={`rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${panelOpen ? 'w-12 h-12' : 'w-16 h-16 mb-4'}`}>
                        <PlusIcon className={`text-blue-600 ${panelOpen ? 'h-6 w-6' : 'h-8 w-8'}`} />
                      </div>
                      <div className={panelOpen ? 'text-left' : 'text-center'}>
                        <span className={`font-semibold text-slate-700 ${panelOpen ? 'text-base' : 'text-lg'}`}>Create New Note</span>
                        {!panelOpen && <span className="text-sm text-slate-400 mt-1 block">Start capturing your ideas</span>}
                      </div>
                    </div>
                  </div>

                  {sortedNotes.map((note, idx) => (
                    <div
                      key={note.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Open note titled ${note.title}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, note.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, note.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => onCardClick(note)}
                      onKeyDown={(e) => (e.key === 'Enter' ? onCardClick(note) : null)}
                      className={`
                        group relative bg-white/80 backdrop-blur-sm rounded-3xl border border-slate-200/60
                        transition-all duration-500 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
                        hover:-translate-y-2 hover:scale-[1.02] hover:shadow-xl hover:shadow-slate-900/10
                        hover:border-slate-300/80 cursor-pointer animate-fadeIn
                        ${draggedNote === note.id ? 'opacity-50 scale-95' : ''}
                        ${pinnedNotes.has(note.id) ? 'ring-2 ring-amber-200 bg-gradient-to-br from-amber-50/50 to-yellow-50/50' : ''}
                        ${panelOpen ? 'p-6 flex items-center gap-6 min-h-[120px]' : 'p-8 min-h-[280px]'}
                      `}
                      style={{ animationDelay: `${(idx + 1) * 80}ms` }}
                    >
                      {panelOpen && (
                        <div className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                          <Bars3Icon className="w-5 h-5" />
                        </div>
                      )}

                      <div className={`absolute flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 ${panelOpen ? 'top-4 right-4' : 'top-6 right-6'}`}>
                        <button
                          type="button"
                          title={pinnedNotes.has(note.id) ? 'Unpin note' : 'Pin note'}
                          aria-label={pinnedNotes.has(note.id) ? 'Unpin note' : 'Pin note'}
                          onClick={(e) => togglePin(note.id, e)}
                          className={`p-2.5 rounded-2xl transition-all duration-200 backdrop-blur-sm bg-white/80 shadow-sm ${
                            pinnedNotes.has(note.id) ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {pinnedNotes.has(note.id) ? <StarSolidIcon className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          title="Edit note"
                          aria-label="Edit note"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditor(note);
                          }}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-200 backdrop-blur-sm bg-white/80 shadow-sm"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete note"
                          aria-label="Delete note"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(note.id);
                          }}
                          className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all duration-200 backdrop-blur-sm bg-white/80 shadow-sm"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className={`flex h-full ${panelOpen ? 'flex-row items-center gap-6 flex-1' : 'flex-col'}`}>
                        {panelOpen && pinnedNotes.has(note.id) && (
                          <div className="flex-shrink-0">
                            <StarSolidIcon className="w-5 h-5 text-amber-500" />
                          </div>
                        )}

                        <div className={panelOpen ? 'flex-1 min-w-0' : 'flex-1'}>
                          <h3 className={`font-bold text-slate-900 leading-tight font-serif line-clamp-2 ${panelOpen ? 'text-lg mb-2 pr-0' : 'text-xl mb-4 pr-20'}`}>{note.title}</h3>

                          <p className={`text-slate-600 leading-relaxed ${panelOpen ? 'text-sm line-clamp-2 mb-2' : 'text-base mb-6 line-clamp-4 flex-1'}`}>
                            {note.content.substring(0, panelOpen ? 100 : 180)}
                            {note.content.length > (panelOpen ? 100 : 180) && '...'}
                          </p>

                          {note.tags?.length > 0 && (
                            <div className={`flex flex-wrap gap-2 ${panelOpen ? 'mb-2' : 'mb-6'}`}>
                              {note.tags.slice(0, panelOpen ? 2 : 3).map((tag, index) => (
                                <span key={index} className={`inline-flex items-center rounded-2xl font-medium border ${getTagColor(index)} ${panelOpen ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}>
                                  {tag}
                                </span>
                              ))}
                              {note.tags.length > (panelOpen ? 2 : 3) && (
                                <span className={`inline-flex items-center rounded-2xl font-medium bg-slate-100 text-slate-600 border border-slate-200 ${panelOpen ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs'}`}>
                                  +{note.tags.length - (panelOpen ? 2 : 3)} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className={`flex items-center justify-between ${panelOpen ? 'flex-shrink-0' : 'pt-4 border-t border-slate-100'}`}>
                          <div className={`text-slate-500 flex items-center gap-2 ${panelOpen ? 'text-xs' : 'text-sm'}`}>
                            <BookmarkIcon className="w-4 h-4" />
                            {new Date(note.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                          {!panelOpen && <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-indigo-400"></div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <aside
              className={`
                fixed top-0 right-0 z-40 w-[800px] h-screen
                bg-white/95 backdrop-blur-xl border-l border-slate-200/60 shadow-2xl shadow-slate-900/10
                transition-all duration-700 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
                ${panelOpen ? 'translate-x-0' : 'translate-x-full'}
                overflow-y-auto custom-scrollbar
              `}
            >
              {isEditorOpen && (
                <div className="p-8 animate-slideIn">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900 font-serif">{editingNote ? 'Edit Note' : 'Create New Note'}</h3>
                      <p className="text-slate-500 mt-1">{editingNote ? 'Update your thoughts' : 'Capture your ideas'}</p>
                    </div>
                    <button type="button" onClick={closePanel} className="p-2.5 rounded-2xl hover:bg-slate-100 transition-colors" title="Close editor" aria-label="Close editor">
                      <XMarkIcon className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div>
                      <label htmlFor="title" className="block text-sm font-semibold text-slate-700 mb-3">
                        Title
                      </label>
                      <input
                        id="title"
                        placeholder="Enter a compelling title..."
                        {...register('title', { required: 'Title is required' })}
                        className="w-full px-5 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl 
                                   focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 focus:bg-white
                                   transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                      />
                      {errors.title && <p className="mt-2 text-sm text-red-600 flex items-center gap-1">{errors.title.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-sm font-semibold text-slate-700 mb-3">
                        Content
                      </label>
                      <div className="rounded-2xl overflow-hidden border border-slate-200 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-300 transition-all duration-200">
                        <JoditEditor value={editorContent} config={editorConfig} onBlur={(newContent) => setEditorContent(newContent)} onChange={(newContent) => setEditorContent(newContent)} />
                      </div>
                      {errors.content && <p className="mt-2 text-sm text-red-600">{errors.content.message}</p>}
                    </div>

                    <div>
                      <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 mb-3">
                        Tags
                      </label>
                      <input
                        id="tags"
                        placeholder="Add tags separated by commas..."
                        {...register('tags')}
                        className="w-full px-5 py-4 bg-slate-50/80 border border-slate-200 rounded-2xl 
                                   focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 focus:bg-white
                                   transition-all duration-200 text-slate-900 placeholder:text-slate-400"
                      />
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                      <button type="button" onClick={closePanel} className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-medium transition-colors">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 
                                   text-white rounded-2xl font-medium shadow-lg shadow-blue-500/25 transition-all duration-200 
                                   hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-0.5"
                      >
                        {editingNote ? 'Update Note' : 'Create Note'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {isPreviewOpen && selectedNote && (
                <div className="p-8 animate-slideIn">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex gap-3">
                      <button type="button" onClick={goPrev} className="p-2.5 rounded-2xl hover:bg-slate-100 transition-colors" title="Previous note" aria-label="Previous note">
                        <ChevronLeftIcon className="w-5 h-5 text-slate-600" />
                      </button>
                      <button type="button" onClick={goNext} className="p-2.5 rounded-2xl hover:bg-slate-100 transition-colors" title="Next note" aria-label="Next note">
                        <ChevronRightIcon className="w-5 h-5 text-slate-600" />
                      </button>
                    </div>
                    <button type="button" onClick={closePanel} className="p-2.5 rounded-2xl hover:bg-slate-100 transition-colors" title="Close preview" aria-label="Close preview">
                      <XMarkIcon className="w-6 h-6 text-slate-400" />
                    </button>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900 mb-4 leading-tight font-serif">{selectedNote.title}</h2>
                      <div className="text-sm text-slate-500 flex items-center gap-2 mb-6">
                        <BookmarkIcon className="w-4 h-4" />
                        {new Date(selectedNote.created_at).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mb-8"></div>
                    </div>

                    {selectedNote.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {selectedNote.tags.map((tag, i) => (
                          <span key={i} className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium border ${getTagColor(i)}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <article className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-base mb-8" dangerouslySetInnerHTML={{ __html: selectedNote.content }} />

                    <div className="flex gap-4 pt-8 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => openEditor(selectedNote)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 
                                   text-blue-700 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/50
                                   transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5
                                   hover:border-blue-300/50"
                        title="Edit note"
                        aria-label="Edit note"
                      >
                        <div className="p-1.5 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg shadow-sm">
                          <PencilIcon className="w-4 h-4 text-white" />
                        </div>
                        Edit Note
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedNote.id)}
                        className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 
                                   text-red-700 hover:from-red-100 hover:to-rose-100 border border-red-200/50
                                   transition-all duration-200 font-medium shadow-sm hover:shadow-md hover:-translate-y-0.5
                                   hover:border-red-300/50"
                        title="Delete note"
                        aria-label="Delete note"
                      >
                        <div className="p-1.5 bg-gradient-to-br from-red-400 to-red-500 rounded-lg shadow-sm">
                          <TrashIcon className="w-4 h-4 text-white" />
                        </div>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Notes;
