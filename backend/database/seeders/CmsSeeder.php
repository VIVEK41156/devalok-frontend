<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\MenuItem;
use App\Models\Page;
use App\Models\Sculpture;
use App\Models\SculptureImage;
use App\Models\SiteSetting;
use App\Services\MediaService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Imports the content that the demo frontend shipped with (verified contact
 * details from devaloksculptures.in, the client's own photographs, and the
 * clearly-credited reference images for marble). Safe to run more than once:
 * it does nothing if categories already exist. It never creates user accounts.
 */
class CmsSeeder extends Seeder
{
    private array $mediaByFile = [];

    public function __construct(private MediaService $media) {}

    public function run(): void
    {
        if (Category::query()->exists()) {
            $this->command?->warn('CMS content already present; skipping CmsSeeder.');

            return;
        }

        $data = json_decode((string) file_get_contents(__DIR__.'/data/catalog.json'), true, flags: JSON_THROW_ON_ERROR);

        DB::transaction(function () use ($data) {
            $this->seedSettings($data['site']);
            $categoryIds = $this->seedCategories($data['categories']);
            $this->seedSculptures($data['sculptures'], $categoryIds);
            $pages = $this->seedPages($data['values']);
            $this->seedMenus($pages);
        });
    }

    /** "/images/sculptures/x.jpg" → media id (imported once, reused after). */
    private function mediaFor(?string $publicPath, ?string $alt = null): ?int
    {
        if (! $publicPath) {
            return null;
        }
        $relative = preg_replace('#^/images/#', '', $publicPath);
        if (isset($this->mediaByFile[$relative])) {
            return $this->mediaByFile[$relative];
        }
        $abs = __DIR__.'/assets/'.$relative;
        if (! is_file($abs)) {
            $this->command?->warn("Missing seed image: {$relative}");

            return null;
        }
        $m = $this->media->importLocal($abs, ['alt' => $alt, 'title' => pathinfo($relative, PATHINFO_FILENAME)]);

        return $this->mediaByFile[$relative] = $m->id;
    }

    private function seedSettings(array $site): void
    {
        $values = [
            'site_name' => $site['name'],
            'tagline' => $site['tagline'],
            'site_description' => $site['description'],
            'logo_media_id' => (string) $this->mediaFor('/images/brand/logo.png', 'Devalok Sculptures logo'),
            'favicon_media_id' => (string) $this->mediaFor('/images/brand/om.png', 'Devalok Om mark'),
            'contact_email' => $site['email'],
            'contact_phone' => $site['phone'],
            'whatsapp_number' => $site['phone'], // confirmed by the client: same number as the phone
            'address_line_1' => $site['address']['lines'][0] ?? null,
            'address_line_2' => $site['address']['lines'][1] ?? null,
            'address_line_3' => $site['address']['lines'][2] ?? null,
            'map_url' => $site['address']['mapHref'] ?? null,
            'footer_text' => '© '.date('Y').' Devalok Sculptures. All rights reserved.',
            'vision' => $site['vision'],
            'mission' => $site['mission'],
            'seo_default_title' => 'Devalok Sculptures | Handcrafted Stone, Wood, Metal & Marble Sculptures',
            'seo_title_template' => '%s | Devalok Sculptures',
            'seo_default_description' => $site['description'],
        ];
        foreach (SiteSetting::SCHEMA as $key => [$type, $group, $public]) {
            SiteSetting::create([
                'key' => $key, 'value' => $values[$key] ?? null, 'type' => $type, 'group' => $group, 'is_public' => $public,
            ]);
        }
    }

    private function seedCategories(array $categories): array
    {
        $ids = [];
        foreach ($categories as $c) {
            $cat = Category::create([
                'name' => $c['name'],
                'short_name' => $c['shortName'],
                'slug' => $c['slug'],
                'tagline' => $c['tagline'],
                'description' => $c['description'],
                'cover_media_id' => $this->mediaFor($c['coverImage'], $c['name']),
                'sort_order' => $c['order'],
                'is_published' => true,
                'seo_title' => $c['name'],
                'seo_description' => $c['description'],
            ]);
            $ids[$c['id']] = $cat->id;
        }

        return $ids;
    }

    private function seedSculptures(array $sculptures, array $categoryIds): void
    {
        foreach ($sculptures as $s) {
            $sc = Sculpture::create([
                'category_id' => $categoryIds[$s['category']],
                'title' => $s['name'],
                'slug' => $s['slug'],
                'subject' => $s['deity'] ?? null,
                'short_description' => $s['summary'] ?? null,
                'description' => $s['description'] ?? null,
                'materials' => $s['finish'] ?? null,
                'cover_media_id' => $this->mediaFor($s['image']['src'], $s['image']['alt']),
                'cutout_media_id' => isset($s['cutout']) ? $this->mediaFor($s['cutout']['src'], $s['image']['alt']) : null,
                'detail_views' => $s['details'] ?: null,
                'reference_credit' => $s['reference']['credit'] ?? null,
                'reference_license' => $s['reference']['license'] ?? null,
                'reference_url' => $s['reference']['url'] ?? null,
                'is_featured' => (bool) $s['featured'],
                'status' => Sculpture::STATUS_PUBLISHED,
                'sort_order' => $s['order'],
                'seo_title' => $s['name'],
                'seo_description' => $s['summary'] ?? null,
                'published_at' => now(),
            ]);
            // The cover is also the first gallery image so the viewer always has one.
            if ($sc->cover_media_id) {
                SculptureImage::create(['sculpture_id' => $sc->id, 'media_id' => $sc->cover_media_id, 'sort_order' => 0]);
            }
        }
    }

    /** @return array<string, Page> */
    private function seedPages(array $values): array
    {
        $defs = [
            'home' => ['Home', 'Where timeless craftsmanship meets the soul of Indian art.', null],
            'about' => ['About Us', 'We bring devotion to life through finely crafted sculptures that celebrate India’s timeless spiritual heritage.',
                "Devalok Sculptures creates devotional and artistic sculptures in stone, wood, metal and marble. Our work draws on the temple traditions of India: the protective arch of the prabhavali, the poised stance of a standing deity, the joy of a dancing Ganapati.\n\nEvery piece is handcrafted by skilled artisans. We believe the time spent on a crown’s filigree or the folds of a garment is itself an act of devotion, and that a finished sculpture should feel present long before it is placed in a shrine."],
            'products' => ['Sculpture Collections', 'Four materials, each with its own character and tradition. Choose a collection, or open any sculpture to see it closer.', null],
            'gallery' => ['Gallery', 'Walk through our sculptures as you would a museum hall. Filter by material, then open any piece to study its details up close.', null],
            'contact' => ['Contact Us', 'Tell us about the sculpture you are looking for, the space it will live in, or a piece you saw in our gallery.', null],
        ];
        $pages = [];
        foreach ($defs as $slug => [$title, $intro, $content]) {
            $pages[$slug] = Page::create([
                'slug' => $slug, 'title' => $title, 'intro' => $intro, 'content' => $content,
                'seo_title' => $slug === 'home' ? null : $title, 'seo_description' => $intro, 'status' => 'published',
            ]);
        }

        // [key, label, eyebrow, heading, accent, description, cta label, cta url]
        $home = [
            ['hero', 'Hero', 'Devalok Sculptures · Divine Craftsmanship', 'Art that transcends', 'time.', 'Where timeless craftsmanship meets the soul of Indian art. Stone, wood, metal and marble, shaped by skilled hands into forms of devotion.', 'Explore Sculptures', '/gallery'],
            ['introduction', 'Brand introduction', 'The House of Devalok', 'Devotion,', 'given form.', 'At Devalok, we bring devotion to life through finely crafted sculptures that celebrate India’s timeless spiritual heritage.', 'Discover our story', '/about'],
            ['collections', 'Collections', 'Explore our collections', 'Four materials,', 'one devotion.', 'The weight of stone, the warmth of wood, the gleam of metal and the glow of marble. Each asks for its own patience.', null, null],
            ['hall', 'Hall of Devotion (3D)', 'Walk the gallery', 'The Hall of', 'Devotion', null, null, null],
            ['signature', 'Signature sculptures', 'Signature sculptures', 'Pieces that hold', 'a room in silence.', 'A selection from the Devalok collection. Open any piece to step closer: framed details, material and story.', 'Full gallery', '/gallery'],
            ['craft', 'Art & craft story', 'The art & the craft', 'From raw material', 'to sacred presence.', null, null, null],
            ['gallery_preview', 'Gallery preview', 'The gallery', 'Wander the', 'collection.', 'Filter by material and open any sculpture for a closer, museum-style view.', 'Enter the full gallery', '/gallery'],
            ['values', 'Brand values', 'What guides our hands', 'Our values', null, null, null, null],
            ['cta', 'Enquiry call to action', 'Begin a conversation', 'Discover a piece', 'that speaks to you.', 'Looking for a deity for your home shrine, a temple installation or a meaningful gift? Tell us what you have in mind and we’ll guide you to the right sculpture.', 'Send an enquiry', '/contact'],
        ];
        $this->sections($pages['home'], $home);

        $about = [
            ['hero', 'Page header', 'About Devalok', 'Where devotion', 'takes shape.', null, null, null],
            ['philosophy', 'Philosophy', 'Our philosophy', 'A sculpture should', 'hold presence.', null, null, null],
        ];
        foreach ($values as $i => $v) {
            $about[] = ['value_'.($i + 1), 'Value '.($i + 1), $v['numeral'], $v['title'], null, $v['text'], null, null];
        }
        $this->sections($pages['about'], $about);
        $this->sections($pages['products'], [['hero', 'Page header', 'Our collections', 'Stone. Wood. Metal.', 'Marble.', null, null, null]]);
        $this->sections($pages['gallery'], [['hero', 'Page header', 'The Devalok gallery', 'A gallery of', 'devotion.', null, null, null]]);
        $this->sections($pages['contact'], [['hero', 'Page header', 'Contact us', 'Begin a', 'conversation.', null, null, null]]);

        return $pages;
    }

    private function sections(Page $page, array $rows): void
    {
        foreach ($rows as $i => [$key, $label, $eyebrow, $heading, $accent, $desc, $ctaLabel, $ctaUrl]) {
            $page->sections()->create([
                'section_key' => $key, 'label' => $label, 'eyebrow' => $eyebrow, 'heading' => $heading,
                'heading_accent' => $accent, 'description' => $desc, 'cta_label' => $ctaLabel, 'cta_url' => $ctaUrl,
                'is_visible' => true, 'sort_order' => ($i + 1) * 10,
            ]);
        }
    }

    private function seedMenus(array $pages): void
    {
        $items = [['Home', '/', 'home'], ['About Us', '/about', 'about'], ['Products', '/products', 'products'], ['Gallery', '/gallery', 'gallery'], ['Contact Us', '/contact', 'contact']];
        foreach (['header', 'footer'] as $location) {
            foreach ($items as $i => [$label, $url, $slug]) {
                MenuItem::create([
                    'location' => $location, 'label' => $label, 'url' => $url, 'page_id' => $pages[$slug]->id,
                    'sort_order' => ($i + 1) * 10, 'is_active' => true,
                ]);
            }
        }
    }
}
