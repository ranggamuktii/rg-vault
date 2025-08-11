<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Register user baru & langsung beri token JWT (via HttpOnly cookie)
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = auth('api')->login($user);

        return $this->respondWithTokenCookie($token, $user);
    }

    /**
     * Login user (set JWT di HttpOnly cookie)
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email'    => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $credentials = $request->only('email', 'password');

        if (!$token = auth('api')->attempt($credentials)) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = auth('api')->user();

        return $this->respondWithTokenCookie($token, $user);
    }

    /**
     * Ambil data user yang sedang login
     */
    public function me()
    {
        $user = auth('api')->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }
        // FE kamu expect { user: ... }
        return response()->json(['user' => $user]);
    }

    /**
     * Logout user (invalidate token + hapus cookie)
     */
    public function logout()
    {
        try {
            auth('api')->logout();
        } catch (\Throwable $e) {
            // ignore
        }

        return response()->json(['message' => 'Successfully logged out'])
            ->cookie(
                'access_token',
                '',
                -1, // delete
                '/',
                config('session.domain'),
                $this->cookieSecure(),
                true,      // HttpOnly
                false,
                $this->cookieSameSite()
            );
    }

    /**
     * Refresh token JWT (set cookie baru)
     */
    public function refresh()
    {
        $new = auth('api')->refresh(); // ambil dari Authorization yg diisi jwt.cookie
        $user = auth('api')->setToken($new)->user();

        return $this->respondWithTokenCookie($new, $user);
    }


    /**
     * Helper: balas JSON + set cookie JWT HttpOnly
     */
    protected function respondWithTokenCookie(string $token, $user)
    {
        $ttlMinutes = auth('api')->factory()->getTTL(); // menit

        // NOTE: kita TIDAK perlu kirim access_token ke FE lagi.
        // Kalau masih mau kompatibel, bisa kirim; FE kamu abaikan saja.
        return response()->json([
            'user'        => $user,
            'token_type'  => 'bearer',
            'expires_in'  => $ttlMinutes * 60, // detik
        ])->cookie(
            'access_token',
            $token,
            $ttlMinutes,                 // menit
            '/',
            config('session.domain'),    // sesuaikan bila perlu (mis. .yourdomain.com)
            $this->cookieSecure(),
            true,                        // HttpOnly
            false,
            $this->cookieSameSite()
        );
    }

    protected function cookieSecure(): bool
    {
        // Wajib true di production (HTTPS)
        return app()->environment('production');
    }

    protected function cookieSameSite(): string
    {
        // Kalau FE beda domain & cross-site, pakai 'None' (HARUS HTTPS).
        // Kalau satu domain/subdomain, 'Lax' umumnya cukup.
        $val = config('session.same_site', 'lax');
        $val = strtolower($val);
        return $val === 'none' ? 'None' : 'Lax';
    }
}
