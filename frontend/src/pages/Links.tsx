'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useLinkStore } from '../store/linkStore';
import type { Link as LinkType } from '../types';

interface LinkForm {
  url: string;
  title: string;
  description: string;
  category: string;
}

const Links: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<LinkType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { links, isLoading, fetchLinks, createLink, updateLink, deleteLink } = useLinkStore();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<LinkForm>();

  const categories = Array.from(new Set(links.filter((link) => link.category).map((link) => link.category)));

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchLinks(searchTerm, selectedCategory);
    }, 300);
    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, fetchLinks]);

  const openModal = (link?: LinkType) => {
    if (link) {
      setEditingLink(link);
      setValue('url', link.url);
      setValue('title', link.title || '');
      setValue('description', link.description || '');
      setValue('category', link.category || '');
    } else {
      setEditingLink(null);
      reset();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    reset();
  };

  const onSubmit = async (data: LinkForm) => {
    try {
      if (editingLink) {
        await updateLink(editingLink.id, data);
        toast.success('Link updated successfully!');
      } else {
        await createLink(data);
        toast.success('Link created successfully!');
      }
      closeModal();
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const errObj = error as { response?: { data?: { message?: string } } };
        const maybeMsg = errObj.response?.data?.message;
        toast.error(typeof maybeMsg === 'string' ? maybeMsg : 'Something went wrong!');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Something went wrong!');
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this link?')) {
      try {
        await deleteLink(id);
        toast.success('Link deleted successfully!');
      } catch (error: unknown) {
        if (error instanceof Error) {
          toast.error(error.message);
        } else {
          toast.error('Failed to delete link');
        }
      }
    }
  };

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">🔗 Links</h1>
            <p className="text-gray-600 mt-2 text-lg">Save and organize your bookmarks</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-14 pr-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm shadow-sm"
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                aria-label="select category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm shadow-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category || ''}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16" role="status" aria-label="Loading links">
              <div className="animate-spin rounded-full h-10 w-10 border-b-3 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                role="button"
                tabIndex={0}
                aria-label="Add new link"
                onClick={() => openModal()}
                onKeyDown={(e) => (e.key === 'Enter' ? openModal() : null)}
                className="
                  bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 rounded-3xl border-2 border-dashed border-gray-200 
                  flex flex-col items-center justify-center p-8 text-gray-500
                  transition-all duration-300 ease-out transform-gpu will-change-transform
                  hover:-translate-y-1 hover:scale-[1.02] hover:border-blue-400 hover:text-blue-600 hover:shadow-lg hover:shadow-blue-100/50
                  cursor-pointer animate-fadeIn backdrop-blur-sm
                "
              >
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg">
                  <PlusIcon className="h-8 w-8 text-white" />
                </div>
                <span className="font-semibold text-lg">Add Link</span>
              </div>

              {links.map((link, idx) => (
                <div
                  key={link.id}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="
                    bg-white/80 backdrop-blur-sm rounded-3xl p-6 border border-gray-100 hover:border-gray-200
                    hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 ease-out
                    animate-fadeIn group hover:-translate-y-1
                  "
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {link.favicon_url && (
                        <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm bg-white flex-shrink-0">
                          <img
                            src={link.favicon_url || '/placeholder.svg'}
                            alt={`${new URL(link.url).hostname} favicon`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{link.title || ''}</h3>
                    </div>
                    <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                      <button onClick={() => openLink(link.url)} aria-label="Open link" title="Open link" className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 hover:scale-110">
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => openModal(link)} aria-label="Edit link" title="Edit link" className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(link.id)} aria-label="Delete link" title="Delete link" className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {link.description && <p className="text-gray-600 text-sm mb-5 line-clamp-3 leading-relaxed">{link.description}</p>}

                  <div className="flex items-center justify-between mb-4">
                    <p className="text-blue-600 text-sm truncate flex-1 mr-3 font-semibold">{new URL(link.url).hostname}</p>
                    {link.category && <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 text-xs px-3 py-1.5 rounded-full font-semibold">{link.category}</span>}
                  </div>

                  <div className="text-xs text-gray-500 pt-4 border-t border-gray-100 font-medium">
                    {new Date(link.created_at).toLocaleDateString('en-US', {
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 z-40 transition-opacity bg-gray-900/20 backdrop-blur-sm" onClick={closeModal} />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="link-modal-title"
              className="inline-block relative z-50 align-bottom bg-white/95 backdrop-blur-sm rounded-3xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-8">
                  <h3 id="link-modal-title" className="text-2xl font-semibold text-gray-900 mb-8 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">
                    {editingLink ? 'Edit Link' : 'Add New Link'}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">URL *</label>
                      <input
                        {...register('url', {
                          required: 'URL is required',
                          pattern: {
                            value: /^https?:\/\/.+/,
                            message: 'Please enter a valid URL starting with http:// or https://',
                          },
                        })}
                        type="url"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white/80 backdrop-blur-sm"
                        placeholder="https://example.com"
                      />
                      {errors.url && <p className="mt-2 text-sm text-red-600 font-medium">{errors.url.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Title</label>
                      <input
                        {...register('title')}
                        type="text"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Link title (auto-detected if empty)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Description</label>
                      <textarea
                        {...register('description')}
                        rows={3}
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 resize-none bg-white/80 backdrop-blur-sm"
                        placeholder="Optional description"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Category</label>
                      <input
                        {...register('category')}
                        type="text"
                        className="w-full px-5 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="work, personal, resources"
                        list="categories"
                      />
                      <datalist id="categories">
                        {categories.map((category) => (
                          <option key={category} value={category || ''} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-8 py-3 text-sm font-semibold bg-gray-100 hover:bg-gray-200 rounded-2xl transition-all duration-200">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {editingLink ? 'Update Link' : 'Add Link'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Links;
