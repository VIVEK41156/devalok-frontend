<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\MediaService;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class MediaController extends Controller
{
    /** 8 MB per file; images only (content-checked again in MediaService). */
    private const FILE_RULES = ['required', 'file', 'max:8192', 'mimes:jpg,jpeg,png,webp', 'mimetypes:image/jpeg,image/png,image/webp', 'dimensions:max_width=12000,max_height=12000'];

    public function __construct(private MediaService $media) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:6', 'max:100'],
        ]);

        return MediaResource::collection(
            Media::query()->search($request->query('search'))->latest('id')
                ->paginate((int) $request->query('per_page', 30))->withQueryString()
        );
    }

    public function show(Media $medium): JsonResponse
    {
        return response()->json(['data' => (new MediaResource($medium))->resolve() + ['usage' => $medium->usage()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => self::FILE_RULES,
        ]);
        $created = [];
        foreach ($request->file('files') as $file) {
            $created[] = $this->media->store($file, $request->user()->id);
        }
        Activity::record('media.uploaded', null, 'Uploaded '.count($created).' image(s)', ['ids' => array_map(fn ($m) => $m->id, $created)]);

        return response()->json(['data' => MediaResource::collection($created)->resolve()], 201);
    }

    public function update(Request $request, Media $medium): MediaResource
    {
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:160'],
            'alt' => ['nullable', 'string', 'max:255'],
            'caption' => ['nullable', 'string', 'max:500'],
        ]);
        $medium->update($data);
        Activity::record('media.updated', $medium, "Updated image details “{$medium->title}”");

        return new MediaResource($medium);
    }

    public function replace(Request $request, Media $medium): MediaResource
    {
        $request->validate(['file' => self::FILE_RULES]);
        $this->media->replace($medium, $request->file('file'));
        Activity::record('media.replaced', $medium, "Replaced image file “{$medium->title}”");

        return new MediaResource($medium->fresh());
    }

    /** Only unused images can be deleted, so nothing on the site ever loses its picture. */
    public function destroy(Media $medium): JsonResponse
    {
        $usage = $medium->usage();
        if ($usage) {
            throw ValidationException::withMessages([
                'media' => 'This image is still in use ('.count($usage).' place(s)). Remove it from those items first.',
            ]);
        }
        $title = $medium->title;
        $this->media->delete($medium);
        Activity::record('media.deleted', null, "Deleted image “{$title}”");

        return response()->json(['message' => 'Image deleted.']);
    }
}
