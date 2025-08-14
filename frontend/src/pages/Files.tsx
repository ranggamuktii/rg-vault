import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, ArchiveBoxIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useFileStore } from '../store/fileStore';
import type { FileItem } from '../types';

import axios from 'axios';
import SparkMD5 from 'spark-md5';
import imageCompression from 'browser-image-compression';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

type ChunkInfo = {
  index: number;
  blob: Blob;
  uploaded: boolean;
};

type PendingFile = {
  file: File;
  preview: string | null;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error' | 'canceled';
  chunks?: ChunkInfo[];
  fileHash?: string;
  cancel?: () => void;
};

const Files: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const { files, isLoading, fetchFiles, uploadFile, deleteFile } = useFileStore();

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

  // --- Utility ---
  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    return await imageCompression(file, options);
  };

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.currentTime = 2;
      video.muted = true;
      video.playsInline = true;
      video.addEventListener('loadeddata', () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth / 4;
        canvas.height = video.videoHeight / 4;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      });
    });
  };

  const getFileHash = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const chunkSize = 2 * 1024 * 1024;
      const chunks = Math.ceil(file.size / chunkSize);
      let currentChunk = 0;
      const spark = new SparkMD5.ArrayBuffer();
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        if (e.target?.result) {
          spark.append(e.target.result as ArrayBuffer);
          currentChunk++;
          if (currentChunk < chunks) loadNext();
          else resolve(spark.end());
        }
      };
      fileReader.onerror = () => reject('File read error');
      function loadNext() {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        fileReader.readAsArrayBuffer(file.slice(start, end));
      }
      loadNext();
    });
  };

  const createChunks = (file: File, chunkSize = 5 * 1024 * 1024): ChunkInfo[] => {
    const chunks: ChunkInfo[] = [];
    let index = 0;
    for (let start = 0; start < file.size; start += chunkSize) {
      const end = Math.min(start + chunkSize, file.size);
      chunks.push({
        index,
        blob: file.slice(start, end),
        uploaded: false,
      });
      index++;
    }
    return chunks;
  };

  // --- Handle file selection ---
  const handleFilesSelected = async (fileList: FileList) => {
    const filesArray = Array.from(fileList);
    const processedFiles = await Promise.all(
      filesArray.map(async (f) => {
        let preview: string | null = null;
        let fileToUpload = f;
        if (f.type.startsWith('image/')) {
          fileToUpload = await compressImage(f);
          preview = URL.createObjectURL(fileToUpload);
        } else if (f.type.startsWith('video/')) {
          preview = await generateVideoThumbnail(f);
        }
        return {
          file: fileToUpload,
          preview,
          progress: 0,
          status: 'pending' as const,
        };
      })
    );
    setPendingFiles((prev) => [...prev, ...processedFiles]);
  };

  // --- Chunked upload with resume ---
  const uploadPendingFile = async (pf: PendingFile) => {
    try {
      pf.status = 'uploading';
      setPendingFiles((prev) => [...prev]);

      pf.fileHash = await getFileHash(pf.file);
      pf.chunks = createChunks(pf.file);
      const totalChunks = pf.chunks.length;
      let uploadedCount = 0;

      // upload semua chunk
      for (const chunk of pf.chunks) {
        const formData = new FormData();
        formData.append('file', chunk.blob);
        formData.append('chunkIndex', chunk.index.toString());
        formData.append('uploadId', pf.fileHash);
        formData.append('totalChunks', pf.chunks.length.toString());
        formData.append('fileName', pf.file.name);
        formData.append('mimeType', pf.file.type);

        await uploadChunkToServer(formData);
        uploadedCount++;
        pf.progress = Math.round((uploadedCount / totalChunks) * 100);
        setPendingFiles((prev) => [...prev]);
      }

      // panggil merge-chunks setelah semua chunk sukses
      await mergeChunksOnServer(pf.fileHash!, pf.chunks!.length, pf.file.name, pf.file.type);
      pf.status = 'done';
      setPendingFiles((prev) => [...prev]);

      toast.success(`${pf.file.name} berhasil di-upload ke Google Drive!`);

      // refresh daftar file biar langsung muncul
      fetchFiles();
    } catch (err) {
      pf.status = 'error';
      setPendingFiles((prev) => [...prev]);
      toast.error(`${pf.file.name} gagal di-upload`);
    }
  };

  const startUploadAll = () => {
    setPendingFiles((prev) =>
      prev.map((pf) => {
        if (pf.status === 'pending') {
          uploadPendingFile(pf);
        }
        return pf;
      })
    );
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

  // helper API calls
  const uploadChunkToServer = async (formData: FormData) => {
    return axios.post('http://localhost:8000/api/upload-chunk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true, // biar cookie JWT ikut
      onUploadProgress: (e) => {
        if (e.total) {
          const percent = Math.round((e.loaded * 100) / e.total);
          // update progress bar di sini kalau mau
        }
      },
    });
  };

  const mergeChunksOnServer = async (uploadId: string, totalChunks: number, fileName: string, mimeType: string) => {
    return axios.post(
      'http://localhost:8000/api/merge-chunks',
      {
        uploadId,
        totalChunks,
        fileName,
        mimeType,
      },
      {
        withCredentials: true,
      }
    );
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-normal text-gray-900">Files</h1>
            <p className="text-gray-600 mt-1">Store and manage your documents</p>
          </div>
          <button onClick={handleFileSelect} className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm font-medium">
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Files
          </button>
        </div>

        {/* Upload Dropzone */}
        <div
          onClick={handleFileSelect}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
          }}
          className="relative group cursor-pointer rounded-2xl border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-8 transition-all hover:border-blue-500 hover:from-blue-50 hover:to-blue-100"
        >
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="p-4 rounded-full bg-white shadow-sm group-hover:shadow-md transition-all">
              <PlusIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-800 group-hover:text-blue-600 transition-colors">Drag & Drop files here</p>
              <p className="text-sm text-gray-500 mt-1">or click to browse</p>
            </div>
          </div>
        </div>

        {/* Category input */}
        <div className="max-w-xs">
          <input
            type="text"
            placeholder="Category for upload (optional)"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
            className="block w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
          />
        </div>

        {/* Pending files with reorder */}
        {pendingFiles.length > 0 && (
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) return;
              const items = Array.from(pendingFiles);
              const [reordered] = items.splice(result.source.index, 1);
              items.splice(result.destination.index, 0, reordered);
              setPendingFiles(items);
            }}
          >
            <Droppable droppableId="pending-files">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="mt-6 space-y-4">
                  {pendingFiles.map((pf, idx) => (
                    <Draggable key={pf.file.name} draggableId={pf.file.name} index={idx}>
                      {(provided) => (
                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="flex items-center p-4 bg-white rounded-xl shadow-sm border hover:shadow-md transition">
                          {pf.preview ? <img src={pf.preview} alt={pf.file.name} className="h-12 w-12 rounded-lg object-cover" /> : <DocumentIcon className="h-12 w-12 text-gray-400" />}

                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium truncate">{pf.file.name}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1 overflow-hidden">
                              <div
                                className={`h-2 rounded-full transition-all duration-200 ${
                                  pf.status === 'error' ? 'bg-red-500' : pf.status === 'done' ? 'bg-green-500' : pf.status === 'canceled' ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient-x'
                                }`}
                                style={{ width: `${pf.progress}%` }}
                              />
                            </div>
                          </div>

                          {pf.status === 'pending' && (
                            <button onClick={() => uploadPendingFile(pf)} className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                              Upload
                            </button>
                          )}
                          {pf.status === 'uploading' && (
                            <button onClick={() => pf.cancel && pf.cancel()} className="ml-4 px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition">
                              Cancel
                            </button>
                          )}
                          {pf.status === 'done' && <span className="ml-4 text-green-600 font-bold">✓</span>}
                          {pf.status === 'error' && <span className="ml-4 text-red-600 font-bold">✗</span>}
                          {pf.status === 'canceled' && <span className="ml-4 text-yellow-600 font-bold">⚠</span>}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  <button onClick={startUploadAll} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium">
                    Upload All Files
                  </button>
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

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
                    {file.mimetype.startsWith('image/') ? (
                      <div className="w-full h-32 bg-gray-50 rounded-xl overflow-hidden">
                        <img src={file.storage_url || '/placeholder.svg'} alt={file.filename} className="w-full h-full object-cover" />
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

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} className="hidden" accept="*/*" multiple />
      </div>
    </MainLayout>
  );
};

export default Files;
