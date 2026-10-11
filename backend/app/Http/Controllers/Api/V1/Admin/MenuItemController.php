<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\MenuItemResource;
use App\Models\MenuItem;
use App\Rules\SafeUrl;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

class MenuItemController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['location' => ['nullable', Rule::in(MenuItem::LOCATIONS)]]);

        return MenuItemResource::collection(
            MenuItem::query()->when($request->query('location'), fn ($q, $l) => $q->where('location', $l))
                ->orderBy('location')->orderBy('sort_order')->get()
        );
    }

    public function store(Request $request): JsonResponse
    {
        $item = MenuItem::create($this->validated($request));
        Activity::record('menu.created', $item, "Added menu item “{$item->label}”");

        return (new MenuItemResource($item))->response()->setStatusCode(201);
    }

    public function update(Request $request, MenuItem $menuItem): MenuItemResource
    {
        $menuItem->update($this->validated($request, $menuItem));
        Activity::record('menu.updated', $menuItem, "Updated menu item “{$menuItem->label}”");

        return new MenuItemResource($menuItem);
    }

    public function destroy(MenuItem $menuItem): JsonResponse
    {
        $label = $menuItem->label;
        $menuItem->delete();
        Activity::record('menu.deleted', null, "Removed menu item “{$label}”");

        return response()->json(['message' => 'Menu item removed.']);
    }

    private function validated(Request $request, ?MenuItem $item = null): array
    {
        $data = $request->validate([
            'label' => ['required', 'string', 'max:80'],
            'url' => ['required', 'string', 'max:500', new SafeUrl],
            'location' => ['required', Rule::in(MenuItem::LOCATIONS)],
            'parent_id' => ['nullable', 'integer', 'exists:menu_items,id', Rule::notIn(array_filter([$item?->id]))],
            'page_id' => ['nullable', 'integer', 'exists:pages,id'],
            'open_in_new_tab' => ['boolean'],
            'sort_order' => ['nullable', 'integer', 'between:0,1000'],
            'is_active' => ['boolean'],
        ]);
        $data['label'] = strip_tags($data['label']);
        $data['open_in_new_tab'] = $request->boolean('open_in_new_tab');
        $data['is_active'] = $request->boolean('is_active', true);
        $data['sort_order'] = (int) ($data['sort_order'] ?? 0);

        return $data;
    }
}
