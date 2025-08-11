<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Link;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;

class LinkController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->links();

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ILIKE', "%{$search}%")
                    ->orWhere('description', 'ILIKE', "%{$search}%")
                    ->orWhere('url', 'ILIKE', "%{$search}%");
            });
        }

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        $links = $query->orderBy('created_at', 'desc')->paginate(20);
        return response()->json($links);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Fetch metadata if title not provided
        $metadata = $this->fetchUrlMetadata($request->url);

        $link = Auth::user()->links()->create([
            'url' => $request->url,
            'title' => $request->title ?? $metadata['title'] ?? $request->url,
            'description' => $request->description ?? $metadata['description'],
            'favicon_url' => $metadata['favicon'],
            'category' => $request->category
        ]);

        return response()->json($link, 201);
    }

    public function show($id)
    {
        $link = Auth::user()->links()->findOrFail($id);
        return response()->json($link);
    }

    public function update(Request $request, $id)
    {
        $link = Auth::user()->links()->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'url' => 'required|url',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'category' => 'nullable|string|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $link->update($request->only(['url', 'title', 'description', 'category']));
        return response()->json($link);
    }

    public function destroy($id)
    {
        $link = Auth::user()->links()->findOrFail($id);
        $link->delete();

        return response()->json(['message' => 'Link deleted successfully']);
    }

    private function fetchUrlMetadata($url)
    {
        try {
            $response = Http::timeout(10)->get($url);
            $html = $response->body();

            $title = null;
            $description = null;
            $favicon = null;

            // Extract title
            if (preg_match('/<title[^>]*>(.*?)<\/title>/is', $html, $matches)) {
                $title = html_entity_decode(strip_tags($matches[1]));
            }

            // Extract description
            if (preg_match('/<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i', $html, $matches)) {
                $description = html_entity_decode($matches[1]);
            }

            // Extract favicon
            $parsed_url = parse_url($url);
            $base_url = $parsed_url['scheme'] . '://' . $parsed_url['host'];

            if (preg_match('/<link[^>]*rel=["\'](?:shortcut )?icon["\'][^>]*href=["\']([^"\']*)["\'][^>]*>/i', $html, $matches)) {
                $favicon = $matches[1];
                if (!filter_var($favicon, FILTER_VALIDATE_URL)) {
                    $favicon = $base_url . '/' . ltrim($favicon, '/');
                }
            } else {
                $favicon = $base_url . '/favicon.ico';
            }

            return [
                'title' => $title,
                'description' => $description,
                'favicon' => $favicon
            ];
        } catch (\Exception $e) {
            return [
                'title' => null,
                'description' => null,
                'favicon' => null
            ];
        }
    }
}
