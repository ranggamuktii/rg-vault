'use client';

import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, LinkIcon, FolderIcon, ArrowRightIcon, CloudArrowUpIcon, XMarkIcon, ClockIcon, StarIcon, CommandLineIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useNoteStore } from '../store/noteStore';
import { useLinkStore } from '../store/linkStore';
import { useFileStore } from '../store/fileStore';

const Dashboard: React.FC = () => {
  const { stats, isLoading, fetchStats } = useDashboardStore();
  const { user } = useAuthStore();

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showQuickCapture, setShowQuickCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickNoteRef = useRef<HTMLTextAreaElement>(null);

  const { createNote } = useNoteStore();
  const { createLink } = useLinkStore();
  const { uploadFile } = useFileStore();

  const noteForm = useForm<{ title: string; content: string; tags: string }>();
  const linkForm = useForm<{ url: string; title: string; description: string; category: string }>();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statCards = [
    {
      title: 'Notes',
      value: stats?.totalNotes || 0,
      icon: DocumentTextIcon,
      color: 'bg-blue-50 text-blue-600',
      iconBg: 'bg-blue-100',
      link: '/notes',
    },
    {
      title: 'Links',
      value: stats?.totalLinks || 0,
      icon: LinkIcon,
      color: 'bg-green-50 text-green-600',
      iconBg: 'bg-green-100',
      link: '/links',
    },
    {
      title: 'Files',
      value: stats?.totalFiles || 0,
      icon: FolderIcon,
      color: 'bg-purple-50 text-purple-600',
      iconBg: 'bg-purple-100',
      link: '/files',
    },
    {
      title: 'Storage',
      value: stats ? formatFileSize(stats.totalStorage) : '0 Bytes',
      icon: CloudArrowUpIcon,
      color: 'bg-orange-50 text-orange-600',
      iconBg: 'bg-orange-100',
      link: '/files',
    },
  ];

  const handleCreateNote = async (data: { title: string; content: string; tags: string }) => {
    try {
      const noteData = {
        title: data.title,
        content: data.content,
        tags: data.tags
          ? data.tags
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      };
      await createNote(noteData);
      toast.success('Note created successfully!');
      setShowNoteModal(false);
      noteForm.reset();
      fetchStats();
    } catch (error) {
      toast.error('Failed to create note');
    }
  };

  const handleCreateLink = async (data: { url: string; title: string; description: string; category: string }) => {
    try {
      await createLink(data);
      toast.success('Link saved successfully!');
      setShowLinkModal(false);
      linkForm.reset();
      fetchStats();
    } catch (error) {
      toast.error('Failed to save link');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      await uploadFile(file);
      toast.success('File uploaded successfully!');
      fetchStats();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleQuickCapture = async () => {
    const content = quickNoteRef.current?.value.trim();
    if (!content) return;

    try {
      await createNote({
        title: `Quick Note - ${new Date().toLocaleDateString()}`,
        content,
        tags: ['quick-capture'],
      });
      toast.success('Quick note saved!');
      if (quickNoteRef.current) {
        quickNoteRef.current.value = '';
      }
      setShowQuickCapture(false);
      fetchStats();
    } catch (error) {
      toast.error('Failed to save quick note');
    }
  };

  const getGreetingID = () => {
    const hour = Number(
      new Date().toLocaleString('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'Asia/Jakarta',
      })
    );
    if (hour >= 5 && hour < 12) return 'Selamat pagi';
    if (hour >= 12 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  const firstName = (user?.name || '').split(' ')[0];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100">
          <h1 className="text-3xl font-normal text-gray-900 mb-2">
            {getGreetingID()}, {firstName} 👋
          </h1>
          <p className="text-gray-600">Here's what's happening with your personal vault today</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link key={card.title} to={card.link} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${card.iconBg}`}>
                    <IconComponent className={`h-6 w-6 ${card.color.split(' ')[1]}`} />
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-gray-900 mb-1">{card.value}</p>
                  <p className="text-sm text-gray-600">{card.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Productivity Hub - New Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-medium text-gray-900">Productivity Hub</h3>
                <p className="text-gray-600 mt-1">Quick actions to boost your workflow</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-500">Ready</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Primary Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button
                onClick={() => setShowNoteModal(true)}
                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-2xl p-6 transition-all duration-200 border border-blue-200 hover:border-blue-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                    <DocumentTextIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">Ctrl+N</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Create Note</h4>
                <p className="text-sm text-gray-600">Write and organize your thoughts</p>
              </button>

              <button
                onClick={() => setShowLinkModal(true)}
                className="group relative bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-2xl p-6 transition-all duration-200 border border-green-200 hover:border-green-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-600 rounded-xl group-hover:scale-110 transition-transform">
                    <LinkIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">Ctrl+L</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Save Link</h4>
                <p className="text-sm text-gray-600">Bookmark important resources</p>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-2xl p-6 transition-all duration-200 border border-purple-200 hover:border-purple-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                    <FolderIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-xs bg-purple-200 text-purple-800 px-2 py-1 rounded-full">Ctrl+U</div>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Upload File</h4>
                <p className="text-sm text-gray-600">Store documents and media</p>
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button onClick={() => setShowQuickCapture(true)} className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group">
                <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                  <CommandLineIcon className="h-4 w-4 text-orange-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Quick Capture</p>
                  <p className="text-xs text-gray-500">Instant note</p>
                </div>
              </button>

              <Link to="/search" className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group">
                <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                  <MagnifyingGlassIcon className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Search All</p>
                  <p className="text-xs text-gray-500">Find anything</p>
                </div>
              </Link>

              <button onClick={() => toast.success('Coming soon!')} className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group">
                <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                  <StarIcon className="h-4 w-4 text-pink-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Favorites</p>
                  <p className="text-xs text-gray-500">Quick access</p>
                </div>
              </button>

              <button onClick={() => toast.success('Coming soon!')} className="flex items-center space-x-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group">
                <div className="p-2 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                  <ClockIcon className="h-4 w-4 text-teal-600" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">Recent</p>
                  <p className="text-xs text-gray-500">Last viewed</p>
                </div>
              </button>
            </div>

            {/* Quick Capture Inline */}
            {showQuickCapture && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Quick Capture</h4>
                  <button onClick={() => setShowQuickCapture(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  ref={quickNoteRef}
                  placeholder="Jot down a quick thought..."
                  className="w-full p-3 border border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                  rows={3}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      handleQuickCapture();
                    }
                  }}
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-gray-500">Press Ctrl+Enter to save</div>
                  <button onClick={handleQuickCapture} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium">
                    Save Note
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Notes */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Notes</h3>
              <Link to="/notes" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentNotes?.slice(0, 4).map((note) => (
                <div key={note.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No notes yet</p>
                  <button onClick={() => setShowNoteModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
                    Create your first note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Links */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Links</h3>
              <Link to="/links" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentLinks?.slice(0, 4).map((link) => (
                <div key={link.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <LinkIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{link.title || 'Untitled'}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate">{new URL(link.url).hostname}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No links yet</p>
                  <button onClick={() => setShowLinkModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
                    Save your first link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Files</h3>
              <Link to="/files" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-medium">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentFiles?.slice(0, 4).map((file) => (
                <div key={file.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <FolderIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">No files yet</p>
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2 inline-block">
                    Upload your first file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />

        {/* Note Creation Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-black bg-opacity-25 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />

              <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={noteForm.handleSubmit(handleCreateNote)}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Create New Note</h3>
                    <button type="button" onClick={() => setShowNoteModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        {...noteForm.register('title', { required: 'Title is required' })}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter note title"
                      />
                      {noteForm.formState.errors.title && <p className="mt-2 text-sm text-red-600">{noteForm.formState.errors.title.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                      <textarea
                        {...noteForm.register('content', { required: 'Content is required' })}
                        rows={6}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Write your note here..."
                      />
                      {noteForm.formState.errors.content && <p className="mt-2 text-sm text-red-600">{noteForm.formState.errors.content.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                      <input
                        {...noteForm.register('tags')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="work, personal, ideas (comma separated)"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
                    <button type="button" onClick={() => setShowNoteModal(false)} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">
                      Create Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Link Creation Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-black bg-opacity-25 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />

              <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={linkForm.handleSubmit(handleCreateLink)}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-medium text-gray-900">Save New Link</h3>
                    <button type="button" onClick={() => setShowLinkModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                      <input
                        {...linkForm.register('url', {
                          required: 'URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL starting with http:// or https://',
                          },
                        })}
                        type="url"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="https://example.com"
                      />
                      {linkForm.formState.errors.url && <p className="mt-2 text-sm text-red-600">{linkForm.formState.errors.url.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input
                        {...linkForm.register('title')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Link title (auto-detected if empty)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        {...linkForm.register('description')}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Optional description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input
                        {...linkForm.register('category')}
                        type="text"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="work, personal, resources"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-100">
                    <button type="button" onClick={() => setShowLinkModal(false)} className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all">
                      Save Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Dashboard;
