'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, LinkIcon, FolderIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import api from '../services/api';

interface SearchResult {
  type: 'note' | 'link' | 'file';
  id: number;
  title: string;
  snippet: string;
  url?: string;
}

interface GlobalSearchProps {
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const delayedSearch = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(response.data);
      } catch (error) {
        console.error('Search failed:', error);
        // Mock results for demonstration
        setResults([
          {
            type: 'note',
            id: 1,
            title: 'Project Planning Notes',
            snippet: 'Detailed planning for the upcoming project including timelines and resources...',
          },
          {
            type: 'link',
            id: 2,
            title: 'Design Inspiration',
            snippet: 'Collection of modern UI designs and patterns for reference...',
            url: 'https://dribbble.com',
          },
          {
            type: 'file',
            id: 3,
            title: 'presentation.pdf',
            snippet: 'Q4 presentation slides with performance metrics and future goals...',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [query]);

  const getResultLink = (result: SearchResult) => {
    switch (result.type) {
      case 'note':
        return '/notes';
      case 'link':
        return '/links';
      case 'file':
        return '/files';
      default:
        return '/dashboard';
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'note':
        return {
          color: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 border-blue-200/50',
          icon: DocumentTextIcon,
          label: 'Note',
        };
      case 'link':
        return {
          color: 'bg-gradient-to-br from-green-50 to-green-100 text-green-700 border-green-200/50',
          icon: LinkIcon,
          label: 'Link',
        };
      case 'file':
        return {
          color: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200/50',
          icon: FolderIcon,
          label: 'File',
        };
      default:
        return {
          color: 'bg-gradient-to-br from-gray-50 to-gray-100 text-gray-700 border-gray-200/50',
          icon: DocumentTextIcon,
          label: 'Item',
        };
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden border border-gray-100/50">
        <div className="flex items-center gap-4 p-8 border-b border-gray-100/50 bg-gradient-to-r from-gray-50/30 to-white">
          <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl">
            <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
          </div>
          <input ref={inputRef} type="text" placeholder="Search across all your content..." value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 text-lg placeholder-gray-400 focus:outline-none bg-transparent" />
          <div className="flex items-center gap-3">
            <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded-lg">ESC</kbd>
            <button onClick={onClose} className="p-2 rounded-2xl hover:bg-gray-100 transition-colors">
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {query.length >= 2 ? (
            isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-blue-500 mx-auto mb-4" />
                <div className="text-gray-500 font-medium">Searching...</div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mb-6">
                  <MagnifyingGlassIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">No results found</h3>
                <p className="text-gray-500">
                  No results found for <span className="font-semibold">"{query}"</span>
                </p>
              </div>
            ) : (
              <div className="py-2">
                {results.map((result) => {
                  const typeConfig = getTypeConfig(result.type);
                  const IconComponent = typeConfig.icon;

                  return (
                    <Link key={`${result.type}-${result.id}`} to={getResultLink(result)} onClick={onClose} className="block px-8 py-6 hover:bg-gray-50/50 border-b border-gray-50 last:border-b-0 transition-colors group">
                      <div className="flex items-start space-x-5">
                        <div className="flex-shrink-0">
                          <div className={`p-3 rounded-2xl border ${typeConfig.color}`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${typeConfig.color}`}>{typeConfig.label}</span>
                          </div>
                          <p className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors mb-1">{result.title}</p>
                          <p className="text-sm text-gray-500 truncate leading-relaxed">{result.snippet}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-6">
                <MagnifyingGlassIcon className="h-10 w-10 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Search your content</h3>
              <p className="text-gray-500 mb-6">Find notes, links, and files across your personal vault</p>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                    <DocumentTextIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Notes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                    <LinkIcon className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="font-medium">Links</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                    <FolderIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <span className="font-medium">Files</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
