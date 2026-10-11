<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // Privileged actions (users, settings, activity log) — checked on the server for every request.
        Gate::define('admin', fn (User $user) => $user->is_active && $user->isAdmin());

        RateLimiter::for('login', fn (Request $r) => Limit::perMinute(10)->by($r->ip()));
        RateLimiter::for('contact', fn (Request $r) => [
            Limit::perMinute(3)->by($r->ip()),
            Limit::perHour(10)->by($r->ip()),
        ]);
        RateLimiter::for('public-api', fn (Request $r) => Limit::perMinute(240)->by($r->ip()));
    }
}
