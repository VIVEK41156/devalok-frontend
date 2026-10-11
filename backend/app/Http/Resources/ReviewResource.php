<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'location' => $this->location,
            'rating' => $this->rating,
            'content' => $this->content,
            'is_sample' => $this->is_sample,
            'avatar' => $this->relationLoaded('avatar') && $this->avatar ? new MediaResource($this->avatar) : null,
            'sculpture' => $this->relationLoaded('sculpture') && $this->sculpture ? ['id' => $this->sculpture->id, 'title' => $this->sculpture->title, 'slug' => $this->sculpture->slug] : null,
            'sort_order' => $this->sort_order,
            $this->mergeWhen($admin, fn () => [
                'is_published' => $this->is_published,
                'sculpture_id' => $this->sculpture_id,
                'avatar_media_id' => $this->avatar_media_id,
                'updated_at' => $this->updated_at?->toIso8601String(),
            ]),
        ];
    }
}
