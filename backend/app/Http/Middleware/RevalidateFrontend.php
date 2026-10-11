<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * After any successful admin write (create / update / delete / upload / reorder),
 * tell the Next.js website to drop its cached CMS data, so every visitor sees
 * the change on their next page load — regardless of which browser or tab made it.
 *
 * Server-to-server: POST {FRONTEND_REVALIDATE_URL} with a shared secret header.
 * Runs after the response is prepared; a failure never breaks the admin action
 * (the website's own 30-second cache lifetime is the fallback).
 */
class RevalidateFrontend
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'], true) && $response->isSuccessful()) {
            app()->terminating(fn () => self::notify());
        }

        return $response;
    }

    public static function notify(): bool
    {
        $url = config('services.frontend.revalidate_url');
        $secret = config('services.frontend.revalidate_secret');
        if (! $url || ! $secret) {
            return false;
        }
        try {
            return Http::timeout(5)->acceptJson()
                ->withHeaders(['X-Revalidate-Secret' => $secret])
                ->post($url, ['tag' => 'cms'])
                ->successful();
        } catch (\Throwable $e) {
            Log::warning('Frontend revalidation failed: '.$e->getMessage());

            return false;
        }
    }
}
