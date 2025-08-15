<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Alias middleware custom kamu
        $middleware->alias([
            'jwt.cookie' => \App\Http\Middleware\CookieJwtToAuthHeader::class,
        ]);

        // Tambahkan middleware bawaan CORS ke group API
        $middleware->appendToGroup('api', [
            \Illuminate\Http\Middleware\HandleCors::class,
            'jwt.cookie',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
