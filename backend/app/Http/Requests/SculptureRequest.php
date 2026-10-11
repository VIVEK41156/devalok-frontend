<?php

namespace App\Http\Requests;

use App\Models\Sculpture;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SculptureRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route middleware already requires an active, signed-in admin or editor.
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $id = $this->route('sculpture')?->id;

        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:180', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique('sculptures', 'slug')->ignore($id)],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'subject' => ['nullable', 'string', 'max:80'],
            'short_description' => ['nullable', 'string', 'max:300'],
            'description' => ['nullable', 'string', 'max:10000'],
            'materials' => ['nullable', 'string', 'max:160'],
            'dimensions' => ['nullable', 'string', 'max:120'],
            'weight' => ['nullable', 'string', 'max:60'],
            'craftsmanship' => ['nullable', 'string', 'max:5000'],
            'cover_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'cutout_media_id' => ['nullable', 'integer', 'exists:media,id'],
            'gallery_media_ids' => ['nullable', 'array', 'max:30'],
            'gallery_media_ids.*' => ['integer', 'distinct', 'exists:media,id'],
            'detail_views' => ['nullable', 'array', 'max:6'],
            'detail_views.*.label' => ['required', 'string', 'max:40'],
            'detail_views.*.x' => ['required', 'numeric', 'between:0,100'],
            'detail_views.*.y' => ['required', 'numeric', 'between:0,100'],
            'detail_views.*.zoom' => ['required', 'numeric', 'between:1,5'],
            'reference_credit' => ['nullable', 'string', 'max:200'],
            'reference_license' => ['nullable', 'string', 'max:60'],
            'reference_url' => ['nullable', 'url:http,https', 'max:500'],
            'is_featured' => ['boolean'],
            'status' => ['required', Rule::in(Sculpture::STATUSES)],
            'sort_order' => ['nullable', 'integer', 'between:-100000,100000'],
            'seo_title' => ['nullable', 'string', 'max:160'],
            'seo_description' => ['nullable', 'string', 'max:320'],
        ];
    }
}
