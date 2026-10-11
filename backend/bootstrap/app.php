<?php

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\RevalidateFrontend;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA auth: requests from SANCTUM_STATEFUL_DOMAINS get session cookies + CSRF.
        $middleware->statefulApi();
        $middleware->alias(['active' => EnsureUserIsActive::class, 'revalidate' => RevalidateFrontend::class]);
        // API guests get a JSON 401 instead of a redirect to a login page.
        $middleware->redirectGuestsTo(fn (Request $request) => $request->is('api/*') ? null : '/');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // The API always answers in JSON, never with HTML error pages or redirects to /login.
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*') || $request->expectsJson());
    })->create();
