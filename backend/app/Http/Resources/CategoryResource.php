<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Category */
class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'short_name' => $this->short_name ?: $this->name,
            'tagline' => $this->tagline,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'cover' => $this->whenLoaded('cover', fn () => $this->cover ? new MediaResource($this->cover) : null),
            'sort_order' => $this->sort_order,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'sculptures_count' => $this->whenCounted('sculptures'),
            $this->mergeWhen($admin, fn () => [
                'is_published' => $this->is_published,
                'cover_media_id' => $this->cover_media_id,
                'updated_at' => $this->updated_at?->toIso8601String(),
            ]),
        ];
    }
}
