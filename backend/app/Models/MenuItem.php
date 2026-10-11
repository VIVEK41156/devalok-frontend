<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MenuItem extends Model
{
    public const LOCATIONS = ['header', 'footer'];

    protected $fillable = ['location', 'parent_id', 'page_id', 'label', 'url', 'open_in_new_tab', 'sort_order', 'is_active'];

    protected $casts = ['open_in_new_tab' => 'boolean', 'is_active' => 'boolean', 'sort_order' => 'integer'];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(MenuItem::class, 'parent_id')->orderBy('sort_order');
    }

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
