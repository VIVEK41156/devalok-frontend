<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/** A deactivated account loses access immediately, even mid-session. */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user || ! $user->fresh()?->is_active) {
            if ($user && $request->hasSession()) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }

            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        return $next($request);
    }
}
