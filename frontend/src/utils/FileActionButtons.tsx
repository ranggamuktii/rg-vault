import type { PendingFile } from '../types';
import { XMarkIcon, ArrowPathIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/solid';

type FileActionButtonsProps = {
  pf: PendingFile;
  uploadPendingFile: (pf: PendingFile) => void;
  removePendingFile: (filename: string) => void;
};

export function FileActionButtons({ pf, uploadPendingFile, removePendingFile }: FileActionButtonsProps) {
  if (pf.status === 'pending') {
    return (
      <button onClick={() => uploadPendingFile(pf)} className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
        Upload
      </button>
    );
  }

  if (pf.status === 'uploading') {
    return (
      <button onClick={() => pf.cancel && pf.cancel()} className="ml-4 px-3 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 transition inline-flex items-center">
        <XMarkIcon className="h-3 w-3 mr-1" />
        Cancel
      </button>
    );
  }

  if (pf.status === 'done') {
    return <CheckIcon className="ml-4 h-5 w-5 text-green-600" />;
  }

  if (pf.status === 'error') {
    return (
      <div className="ml-4 flex items-center space-x-2">
        <span className="text-red-600 font-bold">✗</span>
        <button onClick={() => uploadPendingFile(pf)} className="px-3 py-1 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition inline-flex items-center">
          <ArrowPathIcon className="h-3 w-3 mr-1" />
          Retry
        </button>
        <button onClick={() => removePendingFile(pf.file.name)} className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition inline-flex items-center">
          <TrashIcon className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    );
  }

  if (pf.status === 'canceled') {
    return (
      <div className="ml-4 flex items-center space-x-2">
        <span className="text-yellow-600 font-bold">⚠</span>
        <button onClick={() => uploadPendingFile(pf)} className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center">
          <ArrowPathIcon className="h-3 w-3 mr-1" />
          Retry
        </button>
        <button onClick={() => removePendingFile(pf.file.name)} className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition inline-flex items-center">
          <TrashIcon className="h-3 w-3 mr-1" />
          Delete
        </button>
      </div>
    );
  }

  return null;
}
