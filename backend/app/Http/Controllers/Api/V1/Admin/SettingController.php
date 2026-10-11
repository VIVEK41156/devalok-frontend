<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Models\SiteSetting;
use App\Rules\SafeUrl;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $stored = SiteSetting::query()->pluck('value', 'key');
        $out = [];
        foreach (SiteSetting::SCHEMA as $key => [$type, $group, $public]) {
            $value = $stored[$key] ?? null;
            $out[] = [
                'key' => $key,
                'value' => $value,
                'type' => $type,
                'group' => $group,
                'is_public' => $public,
                'media_url' => $type === 'media' && $value ? Media::find((int) $value)?->url() : null,
            ];
        }

        return response()->json(['data' => $out]);
    }

    /** Only keys declared in SiteSetting::SCHEMA can be written; each is validated by type. */
    public function update(Request $request): JsonResponse
    {
        $rules = [];
        foreach (SiteSetting::SCHEMA as $key => [$type, , , $max]) {
            $rules["settings.$key"] = match ($type) {
                'email' => ['nullable', 'email', 'max:'.$max],
                'url' => ['nullable', 'string', 'max:'.$max, new SafeUrl(false)],
                'phone' => ['nullable', 'string', 'max:'.$max, 'regex:/^[0-9+()\-\s]*$/'],
                'media' => ['nullable', 'integer', 'exists:media,id'],
                default => ['nullable', 'string', 'max:'.$max],
            };
        }
        $data = $request->validate(['settings' => ['required', 'array']] + $rules);

        $changed = [];
        foreach (array_intersect_key($data['settings'], SiteSetting::SCHEMA) as $key => $value) {
            [$type, $group, $public] = SiteSetting::SCHEMA[$key];
            $value = is_string($value) ? strip_tags(trim($value)) : $value;
            SiteSetting::updateOrCreate(['key' => $key], [
                'value' => $value === null || $value === '' ? null : (string) $value,
                'type' => $type,
                'group' => $group,
                'is_public' => $public,
            ]);
            $changed[] = $key;
        }
        Activity::record('settings.updated', null, 'Updated site settings', ['keys' => $changed]);

        return $this->index();
    }
}
