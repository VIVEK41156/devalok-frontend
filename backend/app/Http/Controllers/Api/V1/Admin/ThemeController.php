<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Brand palette + per-section background colours, stored as one public JSON
 * setting ("theme") that the website turns into CSS variables.
 *
 * Only #rgb / #rrggbb values for known keys are accepted, so nothing a client
 * sends can inject CSS into the site.
 */
class ThemeController extends Controller
{
    public const PALETTE = ['lavender', 'lilac', 'gold', 'gold-deep', 'gold-soft', 'ivory', 'parchment', 'plum', 'plum-deep', 'plum-soft', 'mist'];

    public const SECTIONS = [
        'topbar', 'header', 'footer',
        'home_hero', 'home_intro', 'home_collections', 'home_hall', 'home_signature', 'home_craft', 'home_gallery', 'values', 'home_reviews', 'cta',
        'page_header',
        'products_tabs', 'products_a', 'products_b',
        'gallery_spotlight', 'gallery_grid',
        'about_philosophy', 'about_craft', 'about_materials',
        'contact_section', 'contact_panel',
    ];

    private const HEX = '/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/';

    public function show(): JsonResponse
    {
        return response()->json(['data' => self::current()]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'palette' => ['present', 'array'],
            'palette.*' => ['nullable', 'string', 'regex:'.self::HEX],
            'sections' => ['present', 'array'],
            'sections.*' => ['nullable', 'string', 'regex:'.self::HEX],
        ], [
            'palette.*.regex' => 'Use a hex colour such as #C8A45D.',
            'sections.*.regex' => 'Use a hex colour such as #FAF7F0.',
        ]);

        $theme = [
            'palette' => self::clean($data['palette'] ?? [], self::PALETTE),
            'sections' => self::clean($data['sections'] ?? [], self::SECTIONS),
        ];
        SiteSetting::updateOrCreate(['key' => 'theme'], [
            'value' => json_encode($theme),
            'type' => 'json',
            'group' => 'theme',
            'is_public' => true,
        ]);
        Activity::record('theme.updated', null, 'Updated theme colours', [
            'palette' => array_keys($theme['palette']),
            'sections' => array_keys($theme['sections']),
        ]);

        return response()->json(['data' => $theme, 'message' => 'Colours saved.']);
    }

    /** @return array{palette: array<string,string>, sections: array<string,string>} */
    public static function current(): array
    {
        $raw = json_decode((string) SiteSetting::query()->where('key', 'theme')->value('value'), true);

        return [
            'palette' => self::clean($raw['palette'] ?? [], self::PALETTE),
            'sections' => self::clean($raw['sections'] ?? [], self::SECTIONS),
        ];
    }

    /** Keeps only known keys with valid hex values (empty = use the design default). */
    private static function clean(array $values, array $allowed): array
    {
        $out = [];
        foreach ($allowed as $key) {
            $v = $values[$key] ?? null;
            if (is_string($v) && preg_match(self::HEX, $v)) {
                $out[$key] = strtolower($v);
            }
        }

        return $out;
    }
}
