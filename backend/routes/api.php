<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\NoteController;
use App\Http\Controllers\Api\LinkController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\DashboardController;

// AUTH (public)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);

    // Cookie → Header lalu guard JWT
    Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {
        Route::get('me', [AuthController::class, 'me']);
        Route::post('logout', [AuthController::class, 'logout']);
    });

    // Refresh: cukup butuh token di cookie, tidak perlu 'auth:api'
    // (biar bisa dipanggil saat 401)
    Route::post('refresh', [AuthController::class, 'refresh'])->middleware('jwt.cookie');
});

// PROTECTED API
Route::middleware(['jwt.cookie', 'auth:api'])->group(function () {
    Route::apiResource('notes', NoteController::class);
    Route::apiResource('links', LinkController::class);
    Route::apiResource('files', FileController::class);

    Route::post('files/upload', [FileController::class, 'upload']);
    Route::get('files/{id}/download', [FileController::class, 'download']);

    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('search', [DashboardController::class, 'search']);
});

// Health check
Route::get('test', fn() => response()->json([
    'status' => 'success',
    'message' => 'API is working!',
    'timestamp' => now()->toDateTimeString(),
    'auth_guard' => 'JWT Auth',
]));
