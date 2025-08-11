<?php

namespace App\Http\Middleware;

use Closure;

class CookieJwtToAuthHeader
{
    public function handle($request, Closure $next)
    {
        if ($token = $request->cookie('access_token')) {
            // Hanya set kalau belum ada (biar bisa override saat perlu)
            if (!$request->headers->has('Authorization')) {
                $request->headers->set('Authorization', 'Bearer ' . $token);
            }
        }
        return $next($request);
    }
}
