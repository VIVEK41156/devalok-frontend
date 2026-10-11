<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Models\Sculpture;
use App\Support\Activity;
use App\Support\Slug;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class CategoryController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['search' => ['nullable', 'string', 'max:100']]);
        $q = Category::query()->with('cover')->withCount('sculptures')->ordered();
        if ($term = $request->query('search')) {
            $q->where('name', 'like', '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%');
        }

        return CategoryResource::collection($q->get());
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('cover')->loadCount('sculptures'));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validated($request);
        $data['slug'] = Slug::unique('categories', $request->input('slug') ?: $data['name']);
        $category = Category::create($data);
        Activity::record('category.created', $category, "Created category “{$category->name}”");

        return (new CategoryResource($category->load('cover')->loadCount('sculptures')))->response()->setStatusCode(201);
    }

    public function update(Request $request, Category $category): CategoryResource
    {
        $data = $this->validated($request, $category);
        $data['slug'] = $request->input('slug') ?: $category->slug;
        $category->update($data);
        Activity::record('category.updated', $category, "Updated category “{$category->name}”");

        return new CategoryResource($category->fresh('cover')->loadCount('sculptures'));
    }

    /** Drag-free reordering: the client sends the full ordered list of ids. */
    public function reorder(Request $request): JsonResponse
    {
        $data = $request->validate(['ids' => ['required', 'array', 'max:500'], 'ids.*' => ['integer', 'exists:categories,id']]);
        DB::transaction(function () use ($data) {
            foreach (array_values($data['ids']) as $i => $id) {
                Category::whereKey($id)->update(['sort_order' => $i + 1]);
            }
        });
        Activity::record('category.reordered', null, 'Reordered categories');

        return response()->json(['message' => 'Order saved.']);
    }

    /**
     * Categories that still hold sculptures can only be deleted when a
     * reassign_to category is given; the sculptures move there first.
     */
    public function destroy(Request $request, Category $category): JsonResponse
    {
        $data = $request->validate([
            'reassign_to' => ['nullable', 'integer', 'exists:categories,id', Rule::notIn([$category->id])],
        ]);
        $count = $category->sculptures()->count();
        if ($count > 0 && empty($data['reassign_to'])) {
            throw ValidationException::withMessages([
                'reassign_to' => "This category still has {$count} sculpture(s). Choose a category to move them to before deleting.",
            ]);
        }

        DB::transaction(function () use ($category, $data, $count) {
            if ($count > 0) {
                Sculpture::where('category_id', $category->id)->update(['category_id' => $data['reassign_to']]);
            }
            Category::where('parent_id', $category->id)->update(['parent_id' => null]);
            $category->delete();
        });
        Activity::record('category.deleted', null, "Deleted category “{$category->name}”", ['moved_sculptures' => $count, 'to' => $data['reassign_to'] ?? null]);

        return response()->json(['message' => 'Category deleted.']);
    }

    private function validated(Request $request, ?Category $category = null): array
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'short_name' => ['nullable', 'string', 'max:60'],
            'slug' => ['nullable', 'string', 'max:140', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('categories', 'slug')->ignore($category?->id)],
            'tagline' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:5000'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id', Rule::notIn(array_filter([$category?->id]))],
            'cover_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'sort_order' => ['nullable', 'integer', 'between:-100000,100000'],
            'is_published' => ['boolean'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
        ]);
        unset($data['slug']);
        $data['is_published'] = $request->boolean('is_published', true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }
}
