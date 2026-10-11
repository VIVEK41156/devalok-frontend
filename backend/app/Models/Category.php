<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'parent_id', 'name', 'short_name', 'slug', 'tagline', 'description', 'cover_media_id',
        'sort_order', 'is_published', 'seo_title', 'seo_description',
    ];

    protected $casts = ['is_published' => 'boolean', 'sort_order' => 'integer'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    public function sculptures(): HasMany
    {
        return $this->hasMany(Sculpture::class);
    }

    public function cover(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'cover_media_id');
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('is_published', true);
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('name');
    }
}
