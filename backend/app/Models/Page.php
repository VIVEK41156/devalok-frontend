<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    protected $fillable = [
        'slug', 'title', 'intro', 'content', 'featured_media_id', 'seo_title', 'seo_description',
        'canonical_url', 'og_title', 'og_description', 'og_media_id', 'status',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(PageSection::class)->orderBy('sort_order');
    }

    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'featured_media_id');
    }

    public function ogImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'og_media_id');
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'published');
    }
}
