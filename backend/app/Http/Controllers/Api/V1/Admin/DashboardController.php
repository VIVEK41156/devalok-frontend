<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\SculptureResource;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\ContactEnquiry;
use App\Models\Media;
use App\Models\Sculpture;
use App\Models\SculptureImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $byStatus = Sculpture::query()->selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');

        return response()->json(['data' => [
            'stats' => [
                'published_sculptures' => (int) ($byStatus['published'] ?? 0),
                'draft_sculptures' => (int) ($byStatus['draft'] ?? 0),
                'categories' => Category::count(),
                'gallery_images' => SculptureImage::count(),
                'media_files' => Media::count(),
                'new_enquiries' => ContactEnquiry::where('status', 'new')->count(),
            ],
            'recent_sculptures' => SculptureResource::collection(
                Sculpture::query()->with(['category', 'cover'])->latest('updated_at')->limit(6)->get()
            ),
            // Activity details are admin-only; editors see their own recent actions.
            'recent_activity' => ActivityLogResource::collection(
                ActivityLog::query()->with('user')
                    ->when(! $request->user()->isAdmin(), fn ($q) => $q->where('user_id', $request->user()->id))
                    ->latest('id')->limit(8)->get()
            ),
        ]]);
    }
}
