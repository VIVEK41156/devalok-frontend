<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\PageResource;
use App\Http\Resources\PageSectionResource;
use App\Models\Page;
use App\Models\PageSection;
use App\Rules\SafeUrl;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * The five core pages are fixed (they map to frontend routes), so pages can be
 * edited but not created or deleted. Sections use a stable key and typed fields;
 * no raw HTML or script is accepted anywhere.
 */
class PageController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return PageResource::collection(Page::query()->withCount('sections')->orderBy('id')->get());
    }

    public function show(Page $page): PageResource
    {
        return new PageResource($page->load(['featuredImage', 'ogImage', 'sections.media']));
    }

    public function update(Request $request, Page $page): PageResource
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'intro' => ['nullable', 'string', 'max:2000'],
            'content' => ['nullable', 'string', 'max:20000'],
            'featured_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
            'canonical_url' => ['nullable', 'url:https,http', 'max:500'],
            'og_title' => ['nullable', 'string', 'max:160'],
            'og_description' => ['nullable', 'string', 'max:320'],
            'og_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'status' => ['required', Rule::in(['draft', 'published'])],
        ]);
        foreach (['intro', 'content'] as $f) {
            if (isset($data[$f])) {
                $data[$f] = strip_tags($data[$f]);
            }
        }
        $page->update($data);
        Activity::record('page.updated', $page, "Updated page “{$page->title}”");

        return new PageResource($page->fresh(['featuredImage', 'ogImage', 'sections.media']));
    }

    public function updateSection(Request $request, Page $page, PageSection $section): PageSectionResource
    {
        abort_unless($section->page_id === $page->id, 404);
        $data = $request->validate([
            'eyebrow' => ['nullable', 'string', 'max:120'],
            'heading' => ['nullable', 'string', 'max:200'],
            'heading_accent' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:3000'],
            'media_id' => ['nullable', 'integer', 'exists:media,id'],
            'cta_label' => ['nullable', 'string', 'max:60'],
            'cta_url' => ['nullable', 'string', 'max:500', new SafeUrl],
            'is_visible' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'between:0,1000'],
        ]);
        foreach (['eyebrow', 'heading', 'heading_accent', 'description', 'cta_label'] as $f) {
            if (isset($data[$f])) {
                $data[$f] = strip_tags($data[$f]);
            }
        }
        $data['is_visible'] = $request->boolean('is_visible', true);
        $section->update($data);
        Activity::record('page.section_updated', $page, "Updated section “{$section->label}” on {$page->title}");

        return new PageSectionResource($section->fresh('media'));
    }

    public function reorderSections(Request $request, Page $page): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);
        foreach (array_values($data['ids']) as $i => $id) {
            PageSection::where('page_id', $page->id)->whereKey($id)->update(['sort_order' => ($i + 1) * 10]);
        }
        Activity::record('page.sections_reordered', $page, "Reordered sections on {$page->title}");

        return response()->json(['message' => 'Order saved.']);
    }
}
