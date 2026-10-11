<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Page */
class PageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');
        $sections = $this->relationLoaded('sections')
            ? $this->sections->filter(fn ($s) => $admin || $s->is_visible)->values()
            : null;

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'intro' => $this->intro,
            'content' => $this->content,
            'featured_image' => $this->whenLoaded('featuredImage', fn () => $this->featuredImage ? new MediaResource($this->featuredImage) : null),
            'seo' => [
                'title' => $this->seo_title,
                'description' => $this->seo_description,
                'canonical_url' => $this->canonical_url,
                'og_title' => $this->og_title,
                'og_description' => $this->og_description,
                'og_image' => $this->relationLoaded('ogImage') && $this->ogImage ? new MediaResource($this->ogImage) : null,
            ],
            'sections' => $sections === null ? null : PageSectionResource::collection($sections),
            'sections_count' => $this->whenCounted('sections'),
            'updated_at' => $this->updated_at?->toIso8601String(),
            $this->mergeWhen($admin, fn () => [
                'status' => $this->status,
                'featured_media_id' => $this->featured_media_id,
                'og_media_id' => $this->og_media_id,
                'seo_title' => $this->seo_title,
                'seo_description' => $this->seo_description,
                'canonical_url' => $this->canonical_url,
                'og_title' => $this->og_title,
                'og_description' => $this->og_description,
            ]),
        ];
    }
}
