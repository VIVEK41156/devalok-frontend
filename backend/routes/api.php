<?php

use App\Http\Controllers\Api\V1\Admin\ActivityLogController;
use App\Http\Controllers\Api\V1\Admin\CategoryController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\EnquiryController;
use App\Http\Controllers\Api\V1\Admin\MediaController;
use App\Http\Controllers\Api\V1\Admin\MenuItemController;
use App\Http\Controllers\Api\V1\Admin\PageController;
use App\Http\Controllers\Api\V1\Admin\ReviewController;
use App\Http\Controllers\Api\V1\Admin\SmtpController;
use App\Http\Controllers\Api\V1\Admin\ThemeController;
use App\Http\Controllers\Api\V1\Admin\SculptureController;
use App\Http\Controllers\Api\V1\Admin\SeoController;
use App\Http\Controllers\Api\V1\Admin\SettingController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ContactEnquiryController;
use App\Http\Controllers\Api\V1\PublicController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // ── Public, read-only (published content only) ──────────────────────────
    Route::middleware('throttle:public-api')->group(function () {
        Route::get('site', [PublicController::class, 'site']);
        Route::get('sculptures', [PublicController::class, 'sculptures']);
        Route::get('sculptures/{slug}', [PublicController::class, 'sculpture']);
        Route::get('categories', [PublicController::class, 'categories']);
        Route::get('categories/{slug}', [PublicController::class, 'category']);
        Route::get('pages', [PublicController::class, 'pages']);
        Route::get('pages/{slug}', [PublicController::class, 'page']);
        Route::get('menus', [PublicController::class, 'menus']);
        Route::get('site-settings', [PublicController::class, 'settings']);
    });
    Route::post('contact-enquiries', [ContactEnquiryController::class, 'store'])->middleware('throttle:contact');

    // ── Admin authentication (Sanctum SPA session + CSRF) ──────────────────
    Route::post('admin/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::prefix('admin')->middleware(['auth:sanctum', 'active', 'revalidate'])->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::get('dashboard', DashboardController::class);

        // Content: admins and editors.
        Route::apiResource('sculptures', SculptureController::class);
        Route::post('categories/reorder', [CategoryController::class, 'reorder']);
        Route::apiResource('categories', CategoryController::class);
        Route::post('media/{medium}/replace', [MediaController::class, 'replace']);
        Route::apiResource('media', MediaController::class)->parameters(['media' => 'medium']);
        Route::get('pages', [PageController::class, 'index']);
        Route::get('pages/{page}', [PageController::class, 'show']);
        Route::put('pages/{page}', [PageController::class, 'update']);
        Route::put('pages/{page}/sections/{section}', [PageController::class, 'updateSection']);
        Route::post('pages/{page}/sections/reorder', [PageController::class, 'reorderSections']);
        Route::apiResource('menu-items', MenuItemController::class)->except('show');
        Route::apiResource('enquiries', EnquiryController::class)->except('store');
        Route::get('seo', SeoController::class);
        Route::apiResource('reviews', ReviewController::class)->except('show');

        // Privileged: admins only (enforced server-side by the "admin" gate).
        Route::middleware('can:admin')->group(function () {
            Route::get('settings', [SettingController::class, 'index']);
            Route::put('settings', [SettingController::class, 'update']);
            Route::apiResource('users', UserController::class)->except('show');
            Route::get('activity-logs', ActivityLogController::class);
            Route::get('theme', [ThemeController::class, 'show']);
            Route::put('theme', [ThemeController::class, 'update']);
            Route::get('smtp', [SmtpController::class, 'show']);
            Route::put('smtp', [SmtpController::class, 'update']);
            Route::delete('smtp', [SmtpController::class, 'destroy']);
        });
    });
});
