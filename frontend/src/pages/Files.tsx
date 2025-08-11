import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, ArchiveBoxIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useFileStore } from '../store/fileStore';
import type { FileItem } from '../types';

const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { files, isLoading, isUploading, fetchFiles, uploadFile, deleteFile } = useFileStore();

  // Get unique categories
  const categories = Array.from(new Set(files.filter((file) => file.category).map((file) => file.category)));

  const fileTypes = [
    { value: '', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'application', label: 'Documents' },
    { value: 'text', label: 'Text Files' },
  ];

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchFiles(searchTerm, selectedCategory, selectedType);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, selectedCategory, selectedType, fetchFiles]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB');
      return;
    }

    try {
      await uploadFile(file, uploadCategory || undefined);
      toast.success('File uploaded successfully!');
      setUploadCategory('');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'message' in error.response.data
      ) {
        toast.error((error.response as { data: { message?: string } }).data.message || 'File upload failed');
      } else {
        toast.error('File upload failed');
      }
    }
  };

  const handleDelete = async (id: number, filename: string) => {
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      try {
        await deleteFile(id);
        toast.success('File deleted successfully!');
      } catch {
        toast.error('Failed to delete file');
      }
    }
  };

  const handleDownload = (file: FileItem) => {
    window.open(file.storage_url, '_blank');
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) return PhotoIcon;
    if (mimetype.startsWith('video/')) return VideoCameraIcon;
    if (mimetype.startsWith('audio/')) return MusicalNoteIcon;
    if (mimetype.includes('zip') || mimetype.includes('rar')) return ArchiveBoxIcon;
    return DocumentIcon;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (mimetype: string) => mimetype.startsWith('image/');

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal text-gray-900">Files</h1>
            <p className="text-gray-600 mt-1">Store and manage your documents</p>
          </div>
          <button
            onClick={handleFileSelect}
            disabled={isUploading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>

        {/* Upload Status */}
        {isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-center space-x-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 font-medium">Uploading file...</span>
            </div>
          </div>
        )}

        {/* Upload Category */}
        <div className="max-w-xs">
          <input
            type="text"
            placeholder="Category for upload (optional)"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-48">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              {fileTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Files Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {files.map((file) => {
              const FileIconComponent = getFileIcon(file.mimetype);
              return (
                <div key={file.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className="mb-4">
                    {isImageFile(file.mimetype) ? (
                      <div className="w-full h-32 bg-gray-50 rounded-xl overflow-hidden">
                        <img
                          src={file.storage_url || '/placeholder.svg'}
                          alt={file.filename}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            (e.currentTarget.nextSibling as HTMLElement | null)?.classList.remove('hidden');
                          }}
                        />
                        <div className="hidden w-full h-full flex items-center justify-center">
                          <FileIconComponent className="h-16 w-16 text-gray-400" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-32 bg-gray-50 rounded-xl flex items-center justify-center">
                        <FileIconComponent className="h-16 w-16 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate" title={file.filename}>
                      {file.filename}
                    </h3>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                      {file.category && <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{file.category}</span>}
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      {new Date(file.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>

                    <div className="flex justify-between items-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleDownload(file)} className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium">
                        <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                        Download
                      </button>
                      <button onClick={() => handleDelete(file.id, file.filename)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title={`Delete ${file.filename}`}>
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && files.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
              <PlusIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files yet</h3>
            <p className="text-gray-600 mb-6">Upload your first file to get started</p>
            <button onClick={handleFileSelect} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-medium">
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload your first file
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" accept="*/*" />
      </div>
    </MainLayout>
  );
};

export default Files;
