<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    protected $fillable = ['key', 'value', 'type', 'group', 'is_public'];

    protected $casts = ['is_public' => 'boolean'];

    /**
     * The only keys the CMS knows about. Anything else sent by a client is ignored,
     * so the settings endpoint can never be used to store arbitrary configuration.
     *
     * key => [type, group, public, max length]
     */
    public const SCHEMA = [
        'site_name' => ['text', 'general', true, 120],
        'tagline' => ['text', 'general', true, 160],
        'site_description' => ['textarea', 'general', true, 500],
        'logo_media_id' => ['media', 'branding', true, null],
        'favicon_media_id' => ['media', 'branding', true, null],
        'contact_email' => ['email', 'contact', true, 190],
        'contact_phone' => ['phone', 'contact', true, 40],
        'whatsapp_number' => ['phone', 'contact', true, 40],
        'address_line_1' => ['text', 'contact', true, 160],
        'address_line_2' => ['text', 'contact', true, 160],
        'address_line_3' => ['text', 'contact', true, 160],
        'map_url' => ['url', 'contact', true, 500],
        'social_instagram' => ['url', 'social', true, 500],
        'social_facebook' => ['url', 'social', true, 500],
        'social_youtube' => ['url', 'social', true, 500],
        'social_x' => ['url', 'social', true, 500],
        'footer_text' => ['text', 'footer', true, 200],
        'vision' => ['textarea', 'brand', true, 300],
        'mission' => ['textarea', 'brand', true, 300],
        'seo_default_title' => ['text', 'seo', true, 160],
        'seo_title_template' => ['text', 'seo', true, 80],
        'seo_default_description' => ['textarea', 'seo', true, 320],
        'seo_default_og_media_id' => ['media', 'seo', true, null],
        'enquiry_notification_email' => ['email', 'private', false, 190],
    ];

    /** @return array<string, string|null> */
    public static function publicValues(): array
    {
        return static::query()->where('is_public', true)->pluck('value', 'key')->all();
    }
}
