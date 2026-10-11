<?php

namespace Database\Seeders;

use App\Models\Page;
use App\Models\Review;
use Illuminate\Database\Seeder;

/**
 * Placeholder reviews so the section can be previewed. They are flagged
 * is_sample = true (the website shows a small "Sample" tag) and should be
 * replaced with real client reviews in Admin → Reviews before launch.
 * Safe to re-run: does nothing if any review exists.
 */
class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $home = Page::query()->where('slug', 'home')->first();
        if ($home && ! $home->sections()->where('section_key', 'reviews')->exists()) {
            $home->sections()->create([
                'section_key' => 'reviews', 'label' => 'Client reviews', 'eyebrow' => 'Kind words',
                'heading' => 'Voices of', 'heading_accent' => 'devotion.',
                'description' => 'What families, temples and collectors say about their Devalok sculptures.',
                'is_visible' => true, 'sort_order' => 85,
            ]);
        }

        if (Review::query()->exists()) {
            return;
        }
        $samples = [
            ['Ananya R.', 'Home shrine · Bengaluru', 5, 'The Ganapati we received is even more beautiful in person. Every detail of the crown and ornaments is so finely carved.'],
            ['Temple Trust Committee', 'Temple installation · Karnataka', 5, 'The team understood the agama proportions we needed and guided us patiently through the whole process.'],
            ['Vikram & Meera', 'Gift for parents · Mysuru', 5, 'We ordered a Radha Krishna in wood as an anniversary gift. The finish and warmth of the carving moved everyone.'],
            ['S. Narayanan', 'Collector · Chennai', 4, 'A serious workshop with real respect for tradition. The stone Vishnu now anchors our living room.'],
            ['Priya K.', 'New home · Hyderabad', 5, 'From the first call to delivery, everything felt personal. The marble Saraswati is serene and perfectly polished.'],
            ['Rahul D.', 'Office reception · Pune', 5, 'Our brass Nataraja draws compliments from every visitor. Packaging and delivery were handled with great care.'],
        ];
        foreach ($samples as $i => [$name, $location, $rating, $content]) {
            Review::create(['name' => $name, 'location' => $location, 'rating' => $rating, 'content' => $content, 'is_sample' => true, 'is_published' => true, 'sort_order' => $i + 1]);
        }
    }
}
