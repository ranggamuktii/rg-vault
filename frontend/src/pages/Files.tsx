'use client';

import type React from 'react';

import { useEffect, useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { PlusIcon, TrashIcon, ArrowDownTrayIcon, DocumentIcon, PhotoIcon, VideoCameraIcon, MusicalNoteIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';
import MainLayout from '../components/Layout/MainLayout';
import { useFileStore } from '../store/fileStore';
import { FileActionButtons } from '../utils/FileActionButtons';
import type { FileItem, PendingFile, ChunkInfo } from '../types';

import axios from 'axios';
import SparkMD5 from 'spark-md5';
import imageCompression from 'browser-image-compression';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const API_URL = import.meta.env.VITE_API_URL;

const token = localStorage.getItem('access_token');
const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

const Files: React.FC = () => {
  const [uploadCategory, setUploadCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);

  const { files, isLoading, fetchFiles, deleteFile } = useFileStore();

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

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

  const uploadPendingFile = async (pf: PendingFile) => {
    try {
      pf.status = 'uploading';
      setPendingFiles((prev) => [...prev]);

      pf.fileHash = await getFileHash(pf.file);
      pf.chunks = createChunks(pf.file);
      const totalChunks = pf.chunks.length;
      let uploadedCount = 0;

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

      await mergeChunksOnServer(pf.fileHash!, pf.chunks!.length, pf.file.name, pf.file.type);
      pf.status = 'done';
      setPendingFiles((prev) => [...prev]);

      toast.success(`${pf.file.name} berhasil di-upload ke Google Drive!`);
      fetchFiles();
    } catch {
      pf.status = 'error';
      setPendingFiles((prev) => [...prev]);
      toast.error(`${pf.file.name} gagal di-upload`);
    }
  };

  const removePendingFile = (filename: string) => {
    setPendingFiles((files) => files.filter((f) => f.file.name !== filename));
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

  const uploadChunkToServer = async (formData: FormData) => {
    return axios.post(`${API_URL}/upload-chunk`, formData, {
      headers: { 'Content-Type': 'multipart/form-data', ...authHeaders },
      withCredentials: true,
    });
  };

  const mergeChunksOnServer = async (uploadId: string, totalChunks: number, fileName: string, mimeType: string) => {
    return axios.post(`${API_URL}/merge-chunks`, { uploadId, totalChunks, fileName, mimeType }, { withCredentials: true });
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-6 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">📂 Files</h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">Store and manage your documents with ease</p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div
              onClick={handleFileSelect}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) handleFilesSelected(e.dataTransfer.files);
              }}
              className="relative group cursor-pointer rounded-2xl sm:rounded-3xl border-2 border-dashed border-gray-200 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 p-12 sm:p-16 transition-all duration-300 hover:border-blue-400 hover:from-blue-50 hover:to-indigo-100/60 hover:shadow-lg hover:shadow-blue-100/50"
            >
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6 text-center">
                <div className="p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
                  <PlusIcon className="h-10 sm:h-12 w-10 sm:w-12 text-white" />
                </div>
                <div>
                  <p className="text-lg sm:text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">Drag & Drop files here</p>
                  <p className="text-gray-500 mt-1 sm:mt-2 text-base sm:text-lg">or click to browse</p>
                </div>
              </div>
            </div>

            <div className="max-w-sm">
              <label className="block text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Category (optional)</label>
              <input
                type="text"
                placeholder="e.g. Invoices, Reports, Photos..."
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="block w-full px-4 sm:px-5 py-3 sm:py-4 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm shadow-sm bg-white/80 backdrop-blur-sm"
              />
            </div>
          </div>

          {pendingFiles.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text">Pending Uploads</h2>
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
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
                      {pendingFiles.map((pf, idx) => (
                        <Draggable key={pf.file.name} draggableId={pf.file.name} index={idx}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center p-4 sm:p-6 bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300"
                            >
                              {pf.preview ? (
                                <img src={pf.preview || '/placeholder.svg'} alt={pf.file.name} className="h-12 sm:h-14 w-12 sm:w-14 rounded-lg sm:rounded-xl object-cover shadow-sm" />
                              ) : (
                                <div className="h-12 sm:h-14 w-12 sm:w-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <DocumentIcon className="h-6 sm:h-8 w-6 sm:w-8 text-gray-400" />
                                </div>
                              )}

                              <div className="ml-4 sm:ml-5 flex-1">
                                <p className="text-sm font-semibold truncate text-gray-900">{pf.file.name}</p>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 sm:h-3 mt-2 sm:mt-3 overflow-hidden">
                                  <div
                                    className={`h-2.5 sm:h-3 rounded-full transition-all duration-300 ${
                                      pf.status === 'error'
                                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                                        : pf.status === 'done'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                                        : pf.status === 'canceled'
                                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                        : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600'
                                    }`}
                                    style={{ width: `${pf.progress}%` }}
                                  />
                                </div>
                              </div>

                              <FileActionButtons pf={pf} uploadPendingFile={uploadPendingFile} removePendingFile={removePendingFile} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                <div className="pt-4 sm:pt-6">
                  <button
                    onClick={startUploadAll}
                    className="w-full px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-200/50 transform hover:-translate-y-0.5 text-sm sm:text-base"
                  >
                    Upload All Files
                  </button>
                </div>
              </DragDropContext>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-8 sm:h-10 w-8 sm:w-10 border-b-3 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {files.map((file) => {
                const FileIconComponent = getFileIcon(file.mimetype);
                return (
                  <div
                    key={file.id}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 group hover:-translate-y-1"
                  >
                    <div className="mb-4 sm:mb-5">
                      {file.mimetype.startsWith('image/') ? (
                        <div className="w-full h-32 sm:h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-inner">
                          <img src={file.storage_url || '/placeholder.svg'} alt={file.filename} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-full h-32 sm:h-36 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner">
                          <FileIconComponent className="h-12 sm:h-16 w-12 sm:w-16 text-gray-400" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="text-sm font-semibold text-gray-900 truncate" title={file.filename}>
                        {file.filename}
                      </h3>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-medium">{formatFileSize(file.size)}</span>
                        {file.category && <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-medium">{file.category}</span>}
                      </div>

                      <div className="text-xs text-gray-500 pt-2 sm:pt-3 border-t border-gray-100 font-medium">
                        {new Date(file.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>

                      <div className="flex justify-between items-center pt-2 sm:pt-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => handleDownload(file)}
                          className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-200"
                        >
                          <ArrowDownTrayIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4 mr-1 sm:mr-1.5" />
                          Download
                        </button>
                        <button
                          onClick={() => handleDelete(file.id, file.filename)}
                          className="p-2 sm:p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl transition-all duration-200"
                          title={`Delete ${file.filename}`}
                        >
                          <TrashIcon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hidden file input */}
          <input aria-label="file input ref" ref={fileInputRef} type="file" onChange={(e) => e.target.files && handleFilesSelected(e.target.files)} className="hidden" accept="*/*" multiple />
        </div>
      </div>
    </MainLayout>
  );
};

export default Files;
