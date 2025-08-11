<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class FileController extends Controller
{
    private $googleDrive;

    public function __construct(GoogleDriveService $googleDrive)
    {
        $this->googleDrive = $googleDrive;
    }

    public function index(Request $request)
    {
        $query = Auth::user()->files();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where('filename', 'ILIKE', "%{$search}%");
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by file type
        if ($request->has('type')) {
            $type = $request->type;
            $query->where('mimetype', 'LIKE', "{$type}/%");
        }

        $files = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($files);
    }

    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:51200', // 50MB max
            'category' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $mimeType = $file->getMimeType();
            $size = $file->getSize();

            // Upload to Google Drive
            $driveFile = $this->googleDrive->uploadFile(
                $file->getPathname(),
                $fileName,
                $mimeType
            );

            // Save metadata to database
            $fileRecord = Auth::user()->files()->create([
                'filename' => $fileName,
                'storage_url' => $driveFile['webContentLink'],
                'storage_id' => $driveFile['id'],
                'mimetype' => $mimeType,
                'size' => $size,
                'category' => $request->category
            ]);

            return response()->json($fileRecord, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'File upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        $file = Auth::user()->files()->findOrFail($id);
        return response()->json($file);
    }

    public function download($id)
    {
        $file = Auth::user()->files()->findOrFail($id);
        return redirect($file->storage_url);
    }

    public function destroy($id)
    {
        $file = Auth::user()->files()->findOrFail($id);

        try {
            // Delete from Google Drive
            if ($file->storage_id) {
                $this->googleDrive->deleteFile($file->storage_id);
            }

            // Delete from database
            $file->delete();

            return response()->json(['message' => 'File deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'File deletion failed: ' . $e->getMessage()], 500);
        }
    }
}
