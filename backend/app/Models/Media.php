<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Media extends Model
{
    protected $table = 'media';

    protected $fillable = ['disk', 'path', 'original_name', 'title', 'alt', 'caption', 'mime', 'size', 'width', 'height', 'uploaded_by'];

    protected $casts = ['size' => 'integer', 'width' => 'integer', 'height' => 'integer'];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function url(): string
    {
        return Storage::disk($this->disk)->url($this->path);
    }

    /** Where this file is referenced, for the media library and safe deletion. */
    public function usage(): array
    {
        $id = $this->id;
        $usage = [];
        foreach (Sculpture::query()->where('cover_media_id', $id)->orWhere('cutout_media_id', $id)->get(['id', 'title']) as $s) {
            $usage[] = ['type' => 'sculpture', 'id' => $s->id, 'label' => $s->title];
        }
        foreach (SculptureImage::query()->where('media_id', $id)->with('sculpture:id,title')->get() as $si) {
            $usage[] = ['type' => 'sculpture-gallery', 'id' => $si->sculpture_id, 'label' => $si->sculpture?->title];
        }
        foreach (Category::query()->where('cover_media_id', $id)->get(['id', 'name']) as $c) {
            $usage[] = ['type' => 'category', 'id' => $c->id, 'label' => $c->name];
        }
        foreach (Page::query()->where('featured_media_id', $id)->orWhere('og_media_id', $id)->get(['id', 'title']) as $p) {
            $usage[] = ['type' => 'page', 'id' => $p->id, 'label' => $p->title];
        }
        foreach (PageSection::query()->where('media_id', $id)->get(['id', 'page_id', 'label']) as $ps) {
            $usage[] = ['type' => 'page-section', 'id' => $ps->page_id, 'label' => $ps->label];
        }
        foreach (SiteSetting::query()->where('type', 'media')->where('value', (string) $id)->get(['key']) as $st) {
            $usage[] = ['type' => 'setting', 'id' => null, 'label' => $st->key];
        }

        return $usage;
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (! $term) {
            return $q;
        }
        $like = '%'.str_replace(['%', '_'], ['\%', '\_'], $term).'%';

        return $q->where(fn ($w) => $w->where('title', 'like', $like)->orWhere('original_name', 'like', $like)->orWhere('alt', 'like', $like));
    }
}
