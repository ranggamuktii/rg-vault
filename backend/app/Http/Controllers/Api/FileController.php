<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\File;
use App\Services\GoogleDriveService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

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

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('filename', 'ILIKE', "%{$search}%");
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

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
            'file' => 'required|file|max:51200',
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

            $driveFile = $this->googleDrive->uploadFile(
                $file->getPathname(),
                $fileName,
                $mimeType
            );

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

    public function uploadChunk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|file',
            'chunkIndex' => 'required|integer',
            'uploadId' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $uploadId = $request->uploadId;
            $chunkIndex = $request->chunkIndex;
            $file = $request->file('file');

            $chunkDir = storage_path("app/chunks/{$uploadId}");
            if (!is_dir($chunkDir)) {
                mkdir($chunkDir, 0775, true);
            }

            $chunkPath = "{$chunkDir}/chunk_{$chunkIndex}";
            move_uploaded_file($file->getPathname(), $chunkPath);

            return response()->json(['message' => "Chunk {$chunkIndex} uploaded successfully"]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Chunk upload failed: ' . $e->getMessage()], 500);
        }
    }

    public function mergeChunks(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'uploadId' => 'required|string',
            'totalChunks' => 'required|integer',
            'fileName' => 'required|string',
            'mimeType' => 'required|string',
            'category' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $uploadId = $request->uploadId;
            $totalChunks = $request->totalChunks;
            $fileName = $request->fileName;
            $mimeType = $request->mimeType;

            $chunkDir = storage_path("app/chunks/{$uploadId}");
            $finalPath = storage_path("app/chunks/{$uploadId}_final");

            $output = fopen($finalPath, 'ab');

            for ($i = 0; $i < $totalChunks; $i++) {
                $chunkFile = "{$chunkDir}/chunk_{$i}";
                if (!file_exists($chunkFile)) {
                    return response()->json(['error' => "Missing chunk {$i}"], 400);
                }
                $in = fopen($chunkFile, 'rb');
                stream_copy_to_stream($in, $output);
                fclose($in);
            }
            fclose($output);

            $size = filesize($finalPath);

            $driveFile = $this->googleDrive->uploadFile(
                $finalPath,
                $fileName,
                $mimeType
            );

            $fileRecord = Auth::user()->files()->create([
                'filename' => $fileName,
                'storage_url' => $driveFile['webContentLink'],
                'storage_id' => $driveFile['id'],
                'mimetype' => $mimeType,
                'size' => $size,
                'category' => $request->category
            ]);


            Storage::deleteDirectory("chunks/{$uploadId}");
            @unlink($finalPath);

            return response()->json($fileRecord, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Merge failed: ' . $e->getMessage()], 500);
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
            if ($file->storage_id) {
                $this->googleDrive->deleteFile($file->storage_id);
            }
            $file->delete();

            return response()->json(['message' => 'File deleted successfully']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'File deletion failed: ' . $e->getMessage()], 500);
        }
    }
}
