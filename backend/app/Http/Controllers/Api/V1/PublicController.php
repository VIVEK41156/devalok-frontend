<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\MenuItemResource;
use App\Http\Resources\PageResource;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use App\Http\Resources\SculptureResource;
use App\Models\Category;
use App\Models\Media;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Sculpture;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Read-only endpoints for the public website. Everything here is filtered to
 * published content; drafts and private settings never leave the server.
 */
class PublicController extends Controller
{
    private const SCULPTURE_RELATIONS = ['category', 'cover', 'cutout', 'images.media'];

    public function sculptures(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'category' => ['nullable', 'string', 'max:140'],
            'featured' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $q = Sculpture::query()->published()->with(self::SCULPTURE_RELATIONS)->ordered();
        if ($slug = $request->query('category')) {
            $q->whereHas('category', fn ($c) => $c->where('slug', $slug));
        }
        if ($request->boolean('featured')) {
            $q->where('is_featured', true);
        }

        return SculptureResource::collection($q->paginate((int) $request->query('per_page', 24))->withQueryString());
    }

    public function sculpture(string $slug): SculptureResource
    {
        $s = Sculpture::query()->published()->with(self::SCULPTURE_RELATIONS)->where('slug', $slug)->firstOrFail();

        return new SculptureResource($s);
    }

    public function categories(): AnonymousResourceCollection
    {
        $cats = Category::query()->published()->ordered()->with('cover')
            ->withCount(['sculptures' => fn ($q) => $q->where('status', Sculpture::STATUS_PUBLISHED)])
            ->get();

        return CategoryResource::collection($cats);
    }

    public function category(string $slug): CategoryResource
    {
        $cat = Category::query()->published()->with('cover')->where('slug', $slug)
            ->withCount(['sculptures' => fn ($q) => $q->where('status', Sculpture::STATUS_PUBLISHED)])
            ->firstOrFail();

        return new CategoryResource($cat);
    }

    public function pages(): AnonymousResourceCollection
    {
        return PageResource::collection(Page::query()->published()->with(['featuredImage', 'ogImage'])->orderBy('id')->get());
    }

    public function page(string $slug): PageResource
    {
        $page = Page::query()->published()->with(['featuredImage', 'ogImage', 'sections.media'])->where('slug', $slug)->firstOrFail();

        return new PageResource($page);
    }

    public function menus(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->menuTree()]);
    }

    public function settings(): JsonResponse
    {
        return response()->json(['data' => $this->publicSettings()]);
    }

    /**
     * Everything the public layout needs in one request (settings, menus,
     * categories, published sculptures and pages), so pages render from a
     * single cached fetch instead of many round trips.
     */
    public function site(): JsonResponse
    {
        $categories = Category::query()->published()->ordered()->with('cover')
            ->withCount(['sculptures' => fn ($q) => $q->where('status', Sculpture::STATUS_PUBLISHED)])
            ->get();
        $sculptures = Sculpture::query()->published()->with(self::SCULPTURE_RELATIONS)->ordered()->limit(500)->get();
        $pages = Page::query()->published()->with(['featuredImage', 'ogImage', 'sections.media'])->get();

        return response()->json([
            'data' => [
                'settings' => $this->publicSettings(),
                'menus' => $this->menuTree(),
                'categories' => CategoryResource::collection($categories),
                'sculptures' => SculptureResource::collection($sculptures),
                'reviews' => ReviewResource::collection(Review::query()->where('is_published', true)->with('avatar')->orderBy('sort_order')->orderByDesc('id')->limit(40)->get()),
                'pages' => $pages->mapWithKeys(fn (Page $p) => [$p->slug => new PageResource($p)]),
            ],
        ]);
    }

    private function menuTree(): array
    {
        $tree = [];
        foreach (MenuItem::LOCATIONS as $loc) {
            $items = MenuItem::query()->where('location', $loc)->whereNull('parent_id')->where('is_active', true)
                ->orderBy('sort_order')->with('children')->get();
            $tree[$loc] = MenuItemResource::collection($items);
        }

        return $tree;
    }

    /** Public keys only; media ids are resolved to URLs. */
    private function publicSettings(): array
    {
        $values = SiteSetting::publicValues();
        foreach ($values as $key => $value) {
            if (str_ends_with($key, '_media_id')) {
                $media = $value ? Media::find((int) $value) : null;
                $values[substr($key, 0, -9)] = $media ? ['url' => $media->url(), 'width' => $media->width, 'height' => $media->height] : null;
                unset($values[$key]);
            }
        }

        return $values;
    }
}
