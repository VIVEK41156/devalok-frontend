<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sculpture extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUSES = [self::STATUS_DRAFT, self::STATUS_PUBLISHED];

    protected $fillable = [
        'category_id', 'title', 'slug', 'subject', 'short_description', 'description', 'materials',
        'dimensions', 'weight', 'craftsmanship', 'cover_media_id', 'cutout_media_id', 'detail_views',
        'reference_credit', 'reference_license', 'reference_url', 'is_featured', 'status', 'sort_order',
        'seo_title', 'seo_description', 'published_at',
    ];

    protected $casts = [
        'detail_views' => 'array',
        'is_featured' => 'boolean',
        'sort_order' => 'integer',
        'published_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function cutout(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cutout_media_id');
    }

    public function images(): HasMany
    {
        return $this->hasMany(SculptureImage::class)->orderBy('sort_order');
    }

    /** Public visibility: the sculpture AND its category must be published. */
    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', self::STATUS_PUBLISHED)
            ->whereHas('category', fn ($c) => $c->where('is_published', true));
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }
}
