import type React from 'react';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon, LinkIcon, FolderIcon, ArrowRightIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuthStore } from '../store/authStore';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { useNoteStore } from '../store/noteStore';
import { useLinkStore } from '../store/linkStore';
import { useFileStore } from '../store/fileStore';
import MainLayout from '../components/Layout/MainLayout';

const Dashboard: React.FC = () => {
  const { stats, isLoading, fetchStats } = useDashboardStore();
  const { user } = useAuthStore();

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { createNote } = useNoteStore();
  const { createLink } = useLinkStore();
  const { uploadFile } = useFileStore();

  const noteForm = useForm<{ title: string; content: string; tags: string }>();
  const linkForm = useForm<{ url: string; title: string; description: string; category: string }>();

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
    } catch {
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
    } catch {
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
    } catch {
      toast.error('Failed to upload file');
    }
  };

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
      iconBg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-100',
      link: '/notes',
    },
    {
      title: 'Links',
      value: stats?.totalLinks || 0,
      icon: LinkIcon,
      iconBg: 'bg-gradient-to-br from-green-50 to-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-100',
      link: '/links',
    },
    {
      title: 'Files',
      value: stats?.totalFiles || 0,
      icon: FolderIcon,
      iconBg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-100',
      link: '/files',
    },
    {
      title: 'Storage',
      value: stats ? formatFileSize(stats.totalStorage) : '0 Bytes',
      icon: CloudArrowUpIcon,
      iconBg: 'bg-gradient-to-br from-orange-50 to-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-100',
      link: '/files',
    },
  ];

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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-500" aria-label="Loading dashboard" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 p-8">
        <div className="bg-gradient-to-r from-white to-blue-50/30 rounded-3xl p-10 border border-gray-100/50 shadow-sm">
          <h1 className="text-4xl font-light text-gray-900 mb-3">
            {getGreetingID()}, {firstName} 👋
          </h1>
          <p className="text-lg text-gray-600">Here's what's happening with your personal vault today</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {statCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Link key={card.title} to={card.link} className={`bg-white rounded-3xl p-8 border ${card.borderColor} hover:border-gray-200 hover:shadow-lg transition-all duration-300 group`}>
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-4 rounded-2xl ${card.iconBg} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className={`h-7 w-7 ${card.iconColor}`} />
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 mb-2">{card.value}</p>
                  <p className="text-base text-gray-600 font-medium">{card.title}</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100/50 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">Productivity Hub</h3>
                <p className="text-gray-600 mt-2">Quick actions to boost your workflow</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-500 font-medium">Ready</span>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button
                type="button"
                aria-label="Create note"
                onClick={() => setShowNoteModal(true)}
                className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-3xl p-8 transition-all duration-300 border border-blue-200/50 hover:border-blue-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <DocumentTextIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs bg-blue-200/80 text-blue-800 px-3 py-1.5 rounded-full font-semibold">Ctrl+N</div>
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Create Note</h4>
                <p className="text-sm text-gray-600">Write and organize your thoughts</p>
              </button>

              <button
                type="button"
                aria-label="Save link"
                onClick={() => setShowLinkModal(true)}
                className="group relative bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-3xl p-8 transition-all duration-300 border border-green-200/50 hover:border-green-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <LinkIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs bg-green-200/80 text-green-800 px-3 py-1.5 rounded-full font-semibold">Ctrl+L</div>
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Save Link</h4>
                <p className="text-sm text-gray-600">Bookmark important resources</p>
              </button>

              <button
                type="button"
                aria-label="Upload file"
                onClick={() => fileInputRef.current?.click()}
                className="group relative bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-3xl p-8 transition-all duration-300 border border-purple-200/50 hover:border-purple-300 hover:shadow-lg"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <FolderIcon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-xs bg-purple-200/80 text-purple-800 px-3 py-1.5 rounded-full font-semibold">Ctrl+U</div>
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-lg">Upload File</h4>
                <p className="text-sm text-gray-600">Store documents and media</p>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Notes */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Recent Notes</h3>
              <Link to="/notes" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-semibold group">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentNotes?.length ? (
                stats.recentNotes.slice(0, 4).map((note) => (
                  <div key={note.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-blue-50/50 transition-colors duration-200">
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                      <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{note.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{new Date(note.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-4">
                    <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No notes yet</p>
                  <button type="button" aria-label="Create first note" onClick={() => setShowNoteModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                    Create your first note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Links */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Recent Links</h3>
              <Link to="/links" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-semibold group">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentLinks?.length ? (
                stats.recentLinks.slice(0, 4).map((link) => (
                  <div key={link.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-green-50/50 transition-colors duration-200">
                    <div className="p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-2xl">
                      <LinkIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{link.title || 'Untitled'}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">{new URL(link.url).hostname}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mb-4">
                    <LinkIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No links yet</p>
                  <button type="button" aria-label="Save first link" onClick={() => setShowLinkModal(true)} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                    Save your first link
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Files */}
          <div className="bg-white rounded-3xl p-8 border border-gray-100/50 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-semibold text-gray-900">Recent Files</h3>
              <Link to="/files" className="text-sm text-blue-600 hover:text-blue-700 flex items-center font-semibold group">
                View all
                <ArrowRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-4">
              {stats?.recentFiles?.length ? (
                stats.recentFiles.slice(0, 4).map((file) => (
                  <div key={file.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-purple-50/50 transition-colors duration-200">
                    <div className="p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                      <FolderIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{file.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center mb-4">
                    <FolderIcon className="h-8 w-8 text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-500 mb-3">No files yet</p>
                  <button type="button" aria-label="Upload first file" onClick={() => fileInputRef.current?.click()} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">
                    Upload your first file
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNoteModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-black/20 backdrop-blur-sm" onClick={() => setShowNoteModal(false)} />
              <div className="inline-block align-bottom bg-white rounded-3xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100/50">
                <form onSubmit={noteForm.handleSubmit(handleCreateNote)}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-semibold text-gray-900">Create New Note</h3>
                    <button type="button" aria-label="Close note modal" title="Close note modal" onClick={() => setShowNoteModal(false)} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="note-title" className="block text-sm font-semibold text-gray-700 mb-3">
                        Title
                      </label>
                      <input
                        id="note-title"
                        {...noteForm.register('title', { required: 'Title is required' })}
                        type="text"
                        placeholder="Enter note title"
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                      {noteForm.formState.errors.title && <p className="mt-2 text-sm text-red-600">{noteForm.formState.errors.title.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="note-content" className="block text-sm font-semibold text-gray-700 mb-3">
                        Content
                      </label>
                      <textarea
                        id="note-content"
                        {...noteForm.register('content', { required: 'Content is required' })}
                        placeholder="Write your note here..."
                        rows={6}
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none transition-all"
                      />
                      {noteForm.formState.errors.content && <p className="mt-2 text-sm text-red-600">{noteForm.formState.errors.content.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="note-tags" className="block text-sm font-semibold text-gray-700 mb-3">
                        Tags
                      </label>
                      <input
                        id="note-tags"
                        {...noteForm.register('tags')}
                        placeholder="work, personal, ideas"
                        type="text"
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-100/50">
                    <button type="button" onClick={() => setShowNoteModal(false)} className="px-8 py-4 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-8 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
                      Create Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {showLinkModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity bg-black/20 backdrop-blur-sm" onClick={() => setShowLinkModal(false)} />
              <div className="inline-block align-bottom bg-white rounded-3xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100/50">
                <form onSubmit={linkForm.handleSubmit(handleCreateLink)}>
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-semibold text-gray-900">Save New Link</h3>
                    <button type="button" aria-label="Close link modal" title="Close link modal" onClick={() => setShowLinkModal(false)} className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-2xl transition-all">
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="link-url" className="block text-sm font-semibold text-gray-700 mb-3">
                        URL *
                      </label>
                      <input
                        id="link-url"
                        {...linkForm.register('url', {
                          required: 'URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL starting with http:// or https://',
                          },
                        })}
                        type="url"
                        placeholder="https://example.com"
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                      {linkForm.formState.errors.url && <p className="mt-2 text-sm text-red-600">{linkForm.formState.errors.url.message}</p>}
                    </div>
                    <div>
                      <label htmlFor="link-title" className="block text-sm font-semibold text-gray-700 mb-3">
                        Title
                      </label>
                      <input
                        id="link-title"
                        {...linkForm.register('title')}
                        placeholder="Link title"
                        type="text"
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="link-description" className="block text-sm font-semibold text-gray-700 mb-3">
                        Description
                      </label>
                      <textarea
                        id="link-description"
                        {...linkForm.register('description')}
                        placeholder="Optional description"
                        rows={3}
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 resize-none transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="link-category" className="block text-sm font-semibold text-gray-700 mb-3">
                        Category
                      </label>
                      <input
                        id="link-category"
                        {...linkForm.register('category')}
                        placeholder="work, personal, resources"
                        type="text"
                        className="w-full px-5 py-4 border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-300 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 pt-8 mt-8 border-t border-gray-100/50">
                    <button type="button" onClick={() => setShowLinkModal(false)} className="px-8 py-4 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all">
                      Cancel
                    </button>
                    <button type="submit" className="px-8 py-4 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg">
                      Save Link
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <input aria-label="handle file input" ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />
      </div>
    </MainLayout>
  );
};

export default Dashboard;
