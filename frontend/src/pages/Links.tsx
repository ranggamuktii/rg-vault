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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-normal text-gray-900">Links</h1>
          <p className="text-gray-600 mt-1">Save and organize your bookmarks</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              aria-label="select category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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

        {/* Links Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Loading links">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Add Link Card */}
            <div
              role="button"
              tabIndex={0}
              aria-label="Add new link"
              onClick={() => openModal()}
              onKeyDown={(e) => (e.key === 'Enter' ? openModal() : null)}
              className="
                bg-white rounded-2xl border border-dashed border-gray-300 ring-1 ring-gray-950/5
                flex flex-col items-center justify-center p-6 text-gray-500
                transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)] transform-gpu will-change-transform
                hover:-translate-y-0.5 hover:scale-[1.01] hover:border-blue-300 hover:text-blue-600
                cursor-pointer animate-fadeIn
              "
            >
              <PlusIcon className="h-8 w-8 mb-2" />
              <span className="font-medium">Add Link</span>
            </div>

            {/* Link Cards */}
            {links.map((link, idx) => (
              <div
                key={link.id}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="
                  bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200
                  hover:shadow-md transition-all duration-300 ease-[cubic-bezier(.16,1,.3,1)]
                  animate-fadeIn group
                "
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {link.favicon_url && (
                      <img
                        src={link.favicon_url}
                        alt={`${new URL(link.url).hostname} favicon`}
                        className="w-6 h-6 rounded flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <h3 className="text-lg font-medium text-gray-900 truncate">{link.title || ''}</h3>
                  </div>
                  <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openLink(link.url)} aria-label="Open link" title="Open link" className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all">
                      <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => openModal(link)} aria-label="Edit link" title="Edit link" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(link.id)} aria-label="Delete link" title="Delete link" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {link.description && <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">{link.description}</p>}

                <div className="flex items-center justify-between mb-3">
                  <p className="text-blue-600 text-sm truncate flex-1 mr-2 font-medium">{new URL(link.url).hostname}</p>
                  {link.category && <span className="inline-block bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full">{link.category}</span>}
                </div>

                <div className="text-xs text-gray-500 pt-3 border-t border-gray-100">
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

      {/* Modal Create/Edit Link */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 z-40 transition-opacity backdrop-blur-sm" onClick={closeModal} />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="link-modal-title"
              className="inline-block relative z-50 align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full"
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-6">
                  <h3 id="link-modal-title" className="text-xl font-medium text-gray-900 mb-6">
                    {editingLink ? 'Edit Link' : 'Add New Link'}
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">URL *</label>
                      <input
                        {...register('url', {
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
                      {errors.url && <p className="mt-2 text-sm text-red-600">{errors.url.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                      <input {...register('title')} type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Link title (auto-detected if empty)" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea {...register('description')} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Optional description" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <input {...register('category')} type="text" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500" placeholder="work, personal, resources" list="categories" />
                      <datalist id="categories">
                        {categories.map((category) => (
                          <option key={category} value={category || ''} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={closeModal} className="px-6 py-3 text-sm font-medium bg-gray-100 rounded-xl hover:bg-gray-200">
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700">
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
