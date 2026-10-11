<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\MenuItem */
class MenuItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');

        return [
            'id' => $this->id,
            'label' => $this->label,
            'url' => $this->url,
            'open_in_new_tab' => $this->open_in_new_tab,
            'location' => $this->location,
            'parent_id' => $this->parent_id,
            'sort_order' => $this->sort_order,
            'children' => $this->whenLoaded('children', fn () => MenuItemResource::collection(
                $admin ? $this->children : $this->children->where('is_active', true)->values()
            )),
            $this->mergeWhen($admin, fn () => [
                'is_active' => $this->is_active,
                'page_id' => $this->page_id,
            ]),
        ];
    }
}
