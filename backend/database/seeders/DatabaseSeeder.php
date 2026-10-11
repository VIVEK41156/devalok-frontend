<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seeds website content only. Administrator accounts are never seeded;
     * create one with: php artisan devalok:create-admin
     */
    public function run(): void
    {
        $this->call([CmsSeeder::class, ReviewSeeder::class]);
    }
}
