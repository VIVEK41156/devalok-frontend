<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SculptureImage extends Model
{
    protected $fillable = ['sculpture_id', 'media_id', 'sort_order'];

    protected $casts = ['sort_order' => 'integer'];

    public function sculpture(): BelongsTo
    {
        return $this->belongsTo(Sculpture::class);
    }

    public function media(): BelongsTo
    {
        return $this->belongsTo(Media::class);
    }
}
