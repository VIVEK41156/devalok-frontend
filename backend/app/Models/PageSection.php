<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PageSection extends Model
{
    protected $fillable = [
        'page_id', 'section_key', 'label', 'eyebrow', 'heading', 'heading_accent', 'description',
        'media_id', 'cta_label', 'cta_url', 'is_visible', 'sort_order',
    ];

    protected $casts = ['is_visible' => 'boolean', 'sort_order' => 'integer'];

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
