<?php

namespace App\Support;

use Illuminate\Support\Str;

class Slug
{
    /** Builds a unique slug for $table, suffixing -2, -3… when taken. */
    public static function unique(string $table, string $source, ?int $ignoreId = null, string $column = 'slug'): string
    {
        $base = Str::slug($source) ?: 'item';
        $base = mb_substr($base, 0, 160);
        $slug = $base;
        $i = 2;
        while (\DB::table($table)->where($column, $slug)->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
