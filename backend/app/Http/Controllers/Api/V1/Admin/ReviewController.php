<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ReviewController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return ReviewResource::collection(Review::query()->with(['avatar', 'sculpture'])->orderBy('sort_order')->orderByDesc('id')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $review = Review::create($this->validated($request));
        Activity::record('review.created', $review, "Added review by {$review->name}");

        return (new ReviewResource($review->load(['avatar', 'sculpture'])))->response()->setStatusCode(201);
    }

    public function update(Request $request, Review $review): ReviewResource
    {
        $review->update($this->validated($request));
        Activity::record('review.updated', $review, "Updated review by {$review->name}");

        return new ReviewResource($review->fresh(['avatar', 'sculpture']));
    }

    public function destroy(Review $review): JsonResponse
    {
        $name = $review->name;
        $review->delete();
        Activity::record('review.deleted', null, "Deleted review by {$name}");

        return response()->json(['message' => 'Review deleted.']);
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'location' => ['nullable', 'string', 'max:120'],
            'rating' => ['required', 'integer', 'between:1,5'],
            'content' => ['required', 'string', 'min:10', 'max:1500'],
            'sculpture_id' => ['nullable', 'integer', 'exists:sculptures,id'],
            'avatar_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'is_sample' => ['boolean'],
            'is_published' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'between:0,10000'],
        ]);
        foreach (['name', 'location', 'content'] as $f) {
            if (isset($data[$f])) {
                $data[$f] = strip_tags($data[$f]);
            }
        }
        $data['is_sample'] = $request->boolean('is_sample');
        $data['is_published'] = $request->boolean('is_published', true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }
}
