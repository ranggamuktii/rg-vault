<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class NoteController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->notes();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ILIKE', "%{$search}%")
                    ->orWhere('content', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by tags
        if ($request->has('tags')) {
            $tags = explode(',', $request->tags);
            $query->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', trim($tag));
                }
            });
        }

        $notes = $query->orderBy('updated_at', 'desc')->paginate(20);
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $note = Auth::user()->notes()->create([
            'title' => $request->title,
            'content' => $request->content,
            'tags' => $request->tags ?? []
        ]);

        return response()->json($note, 201);
    }

    public function show($id)
    {
        $note = Auth::user()->notes()->findOrFail($id);
        return response()->json($note);
    }

    public function update(Request $request, $id)
    {
        $note = Auth::user()->notes()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $note->update([
            'title' => $request->title,
            'content' => $request->content,
            'tags' => $request->tags ?? []
        ]);

        return response()->json($note);
    }

    public function destroy($id)
    {
        $note = Auth::user()->notes()->findOrFail($id);
        $note->delete();

        return response()->json(['message' => 'Note deleted successfully']);
    }
}
