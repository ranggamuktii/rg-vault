import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, DocumentTextIcon, LinkIcon, FolderIcon } from '@heroicons/react/24/outline';
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
          color: 'bg-blue-50 text-blue-700 border-blue-200',
          icon: DocumentTextIcon,
          label: 'Note',
        };
      case 'link':
        return {
          color: 'bg-green-50 text-green-700 border-green-200',
          icon: LinkIcon,
          label: 'Link',
        };
      case 'file':
        return {
          color: 'bg-purple-50 text-purple-700 border-purple-200',
          icon: FolderIcon,
          label: 'File',
        };
      default:
        return {
          color: 'bg-gray-50 text-gray-700 border-gray-200',
          icon: DocumentTextIcon,
          label: 'Item',
        };
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-start justify-center min-h-screen px-4 pt-16 sm:pt-24">
        <div className="fixed inset-0 transition-opacity bg-black bg-opacity-25 backdrop-blur-sm" onClick={onClose} />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl border border-gray-100">
          {/* Search Input */}
          <div className="p-6 border-b border-gray-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search across all your content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
                autoFocus
              />
              <div className="absolute right-4 top-4">
                <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">ESC</kbd>
              </div>
            </div>
          </div>

          {/* Search Results */}
          {query.length >= 2 && (
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <div className="text-gray-500">Searching...</div>
                </div>
              ) : results.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-500">
                    No results found for <span className="font-medium">"{query}"</span>
                  </p>
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result) => {
                    const typeConfig = getTypeConfig(result.type);
                    const IconComponent = typeConfig.icon;

                    return (
                      <Link key={`${result.type}-${result.id}`} to={getResultLink(result)} onClick={onClose} className="block px-6 py-4 hover:bg-gray-50 border-b border-gray-50 last:border-b-0 transition-colors group">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <div className={`p-2 rounded-lg border ${typeConfig.color}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${typeConfig.color}`}>{typeConfig.label}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{result.title}</p>
                            <p className="text-xs text-gray-500 truncate mt-1 leading-relaxed">{result.snippet}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {query.length < 2 && (
            <div className="p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Search your content</h3>
              <p className="text-gray-500 mb-4">Find notes, links, and files across your personal hub</p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-4 w-4" />
                  <span>Notes</span>
                </div>
                <div className="flex items-center space-x-1">
                  <LinkIcon className="h-4 w-4" />
                  <span>Links</span>
                </div>
                <div className="flex items-center space-x-1">
                  <FolderIcon className="h-4 w-4" />
                  <span>Files</span>
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
