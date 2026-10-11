<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** Admin-only (enforced by the can:admin route middleware). */
class ActivityLogController extends Controller
{
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'action' => ['nullable', 'string', 'max:60'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ]);

        return ActivityLogResource::collection(
            ActivityLog::query()->with('user')
                ->when($request->query('action'), fn ($q, $a) => $q->where('action', 'like', str_replace(['%', '_'], ['\%', '\_'], $a).'%'))
                ->latest('id')->paginate((int) $request->query('per_page', 30))->withQueryString()
        );
    }
}
