<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Sculpture */
class SculptureResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');

        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'category' => $this->whenLoaded('category', fn () => [
                'id' => $this->category->id,
                'slug' => $this->category->slug,
                'name' => $this->category->name,
            ]),
            'subject' => $this->subject,
            'short_description' => $this->short_description,
            'description' => $this->description,
            'materials' => $this->materials,
            'dimensions' => $this->dimensions,
            'weight' => $this->weight,
            'craftsmanship' => $this->craftsmanship,
            'cover' => $this->whenLoaded('cover', fn () => $this->cover ? new MediaResource($this->cover) : null),
            'cutout' => $this->whenLoaded('cutout', fn () => $this->cutout ? new MediaResource($this->cutout) : null),
            'gallery' => $this->whenLoaded('images', fn () => $this->images
                ->filter(fn ($i) => $i->media)
                ->map(fn ($i) => new MediaResource($i->media))
                ->values()),
            'detail_views' => $this->detail_views ?? [],
            'reference' => $this->reference_credit ? [
                'credit' => $this->reference_credit,
                'license' => $this->reference_license,
                'url' => $this->reference_url,
            ] : null,
            'is_featured' => $this->is_featured,
            'sort_order' => $this->sort_order,
            'seo_title' => $this->seo_title,
            'seo_description' => $this->seo_description,
            'updated_at' => $this->updated_at?->toIso8601String(),
            $this->mergeWhen($admin, fn () => [
                'status' => $this->status,
                'category_id' => $this->category_id,
                'cover_media_id' => $this->cover_media_id,
                'cutout_media_id' => $this->cutout_media_id,
                'gallery_media_ids' => $this->relationLoaded('images') ? $this->images->pluck('media_id')->values() : [],
                'reference_credit' => $this->reference_credit,
                'reference_license' => $this->reference_license,
                'reference_url' => $this->reference_url,
                'published_at' => $this->published_at?->toIso8601String(),
                'created_at' => $this->created_at?->toIso8601String(),
            ]),
        ];
    }
}
