<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SculptureRequest;
use App\Http\Resources\SculptureResource;
use App\Models\Sculpture;
use App\Models\SculptureImage;
use App\Support\Activity;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SculptureController extends Controller
{
    private const RELATIONS = ['category', 'cover', 'cutout', 'images.media'];

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'category_id' => ['nullable', 'integer'],
            'status' => ['nullable', Rule::in(Sculpture::STATUSES)],
            'featured' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in(['order', 'newest', 'oldest', 'title', 'updated'])],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $q = Sculpture::query()->with(['category', 'cover']);
        if ($term = $request->query('search')) {
            $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';
            $q->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('slug', 'like', $like));
        }
        $q->when($request->query('category_id'), fn ($w, $id) => $w->where('category_id', $id));
        $q->when($request->query('status'), fn ($w, $s) => $w->where('status', $s));
        if ($request->filled('featured')) {
            $q->where('is_featured', $request->boolean('featured'));
        }
        match ($request->query('sort', 'order')) {
            'newest' => $q->latest('created_at'),
            'oldest' => $q->oldest('created_at'),
            'title' => $q->orderBy('title'),
            'updated' => $q->latest('updated_at'),
            default => $q->orderBy('sort_order')->orderBy('id'),
        };

        return SculptureResource::collection($q->paginate((int) $request->query('per_page', 20))->withQueryString());
    }

    public function show(Sculpture $sculpture): SculptureResource
    {
        return new SculptureResource($sculpture->load(self::RELATIONS));
    }

    public function store(SculptureRequest $request): JsonResponse
    {
        $sculpture = DB::transaction(function () use ($request) {
            $data = $this->payload($request);
            $data['slug'] = Slug::unique('sculptures', $request->input('slug') ?: $data['title']);
            $s = Sculpture::create($data);
            $this->syncGallery($s, $request->input('gallery_media_ids', []));

            return $s;
        });
        Activity::record('sculpture.created', $sculpture, "Created sculpture “{$sculpture->title}”");

        return (new SculptureResource($sculpture->load(self::RELATIONS)))->response()->setStatusCode(201);
    }

    public function update(SculptureRequest $request, Sculpture $sculpture): SculptureResource
    {
        $before = $sculpture->status;
        DB::transaction(function () use ($request, $sculpture) {
            $data = $this->payload($request, $sculpture);
            // Keep the existing URL unless a new slug is explicitly provided.
            $data['slug'] = $request->input('slug') ?: $sculpture->slug;
            $sculpture->update($data);
            if ($request->has('gallery_media_ids')) {
                $this->syncGallery($sculpture, $request->input('gallery_media_ids', []));
            }
        });
        $action = $before !== $sculpture->status ? 'sculpture.'.($sculpture->status === 'published' ? 'published' : 'unpublished') : 'sculpture.updated';
        Activity::record($action, $sculpture, "Updated sculpture “{$sculpture->title}”");

        return new SculptureResource($sculpture->fresh(self::RELATIONS));
    }

    public function destroy(Sculpture $sculpture): JsonResponse
    {
        $title = $sculpture->title;
        $sculpture->delete(); // gallery links cascade; media files stay in the library
        Activity::record('sculpture.deleted', null, "Deleted sculpture “{$title}”", ['id' => $sculpture->id]);

        return response()->json(['message' => 'Sculpture deleted.']);
    }

    private function payload(SculptureRequest $request, ?Sculpture $existing = null): array
    {
        // Only fields present in the request are changed, so partial updates
        // (e.g. the quick publish toggle) never wipe other data.
        $data = $request->safe()->except(['gallery_media_ids', 'slug']);
        if ($request->has('is_featured') || ! $existing) {
            $data['is_featured'] = $request->boolean('is_featured');
        }
        if ($request->has('sort_order') || ! $existing) {
            $data['sort_order'] = (int) ($data['sort_order'] ?? 0);
        }
        if ($request->has('detail_views')) {
            $data['detail_views'] = array_values($data['detail_views'] ?? []) ?: null;
        }
        if ($data['status'] === Sculpture::STATUS_PUBLISHED && ! $existing?->published_at) {
            $data['published_at'] = now();
        }

        return $data;
    }

    private function syncGallery(Sculpture $s, array $mediaIds): void
    {
        SculptureImage::query()->where('sculpture_id', $s->id)->delete();
        foreach (array_values(array_unique(array_map('intval', $mediaIds))) as $i => $mediaId) {
            SculptureImage::create(['sculpture_id' => $s->id, 'media_id' => $mediaId, 'sort_order' => $i]);
        }
    }
}
