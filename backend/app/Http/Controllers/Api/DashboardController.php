<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Ambil statistik dashboard untuk user yang sedang login.
     */
    public function stats()
    {
        $user = auth()->user();

        return response()->json([
            'totalNotes'   => $user->notes()->count(),
            'totalLinks'   => $user->links()->count(),
            'totalFiles'   => $user->files()->count(),
            'totalStorage' => $user->files()->sum('size'), // ukuran file dalam bytes

            'recentNotes'  => $user->notes()
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($note) {
                    return [
                        'id'        => $note->id,
                        'title'     => $note->title,
                        'createdAt' => $note->created_at->toIso8601String(),
                    ];
                }),

            'recentLinks'  => $user->links()
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($link) {
                    return [
                        'id'    => $link->id,
                        'title' => $link->title,
                        'url'   => $link->url,
                    ];
                }),

            'recentFiles'  => $user->files()
                ->latest()
                ->take(5)
                ->get()
                ->map(function ($file) {
                    return [
                        'id'    => $file->id,
                        'name'  => $file->name,
                        'size'  => $file->size,
                    ];
                }),
        ]);
    }
}
