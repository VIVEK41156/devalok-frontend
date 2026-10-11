<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Media */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $admin = $request->is('api/v1/admin/*');

        return [
            'id' => $this->id,
            'url' => $this->url(),
            'width' => $this->width,
            'height' => $this->height,
            'alt' => $this->alt,
            'caption' => $this->caption,
            $this->mergeWhen($admin, fn () => [
                'title' => $this->title,
                'original_name' => $this->original_name,
                'mime' => $this->mime,
                'size' => $this->size,
                'created_at' => $this->created_at?->toIso8601String(),
            ]),
        ];
    }
}
