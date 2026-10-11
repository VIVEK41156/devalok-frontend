<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Sanctum SPA (cookie session) authentication. The frontend first calls
 * GET /sanctum/csrf-cookie, then posts here with the X-XSRF-TOKEN header.
 */
class AuthController extends Controller
{
    private const MAX_ATTEMPTS = 5;

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:190'],
            'password' => ['required', 'string', 'max:200'],
            'remember' => ['sometimes', 'boolean'],
        ]);

        $key = 'login:'.Str::lower($data['email']).'|'.$request->ip();
        if (RateLimiter::tooManyAttempts($key, self::MAX_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'email' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ])->status(429);
        }

        $ok = Auth::guard('web')->attempt(
            ['email' => $data['email'], 'password' => $data['password'], 'is_active' => true],
            (bool) ($data['remember'] ?? false),
        );

        if (! $ok) {
            RateLimiter::hit($key, 60);
            // Generic message: never reveal whether the email exists or the account is disabled.
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();

        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->save();
        Activity::record('auth.login', $user, 'Signed in');

        return response()->json(['data' => new UserResource($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            Activity::record('auth.logout', $user, 'Signed out');
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Signed out.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => new UserResource($request->user())]);
    }
}
