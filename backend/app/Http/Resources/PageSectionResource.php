<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\PageSection */
class PageSectionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->section_key,
            'label' => $this->label,
            'eyebrow' => $this->eyebrow,
            'heading' => $this->heading,
            'heading_accent' => $this->heading_accent,
            'description' => $this->description,
            'image' => $this->relationLoaded('media') && $this->media ? new MediaResource($this->media) : null,
            'media_id' => $this->media_id,
            'cta_label' => $this->cta_label,
            'cta_url' => $this->cta_url,
            'is_visible' => $this->is_visible,
            'sort_order' => $this->sort_order,
        ];
    }
}
