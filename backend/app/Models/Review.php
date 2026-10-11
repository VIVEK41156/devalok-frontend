<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $fillable = ['name', 'location', 'rating', 'content', 'sculpture_id', 'avatar_media_id', 'is_sample', 'is_published', 'sort_order'];

    protected $casts = ['rating' => 'integer', 'is_sample' => 'boolean', 'is_published' => 'boolean', 'sort_order' => 'integer'];

    public function sculpture(): BelongsTo
    {
        return $this->belongsTo(Sculpture::class);
    }

    public function avatar(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'avatar_media_id');
    }
}
