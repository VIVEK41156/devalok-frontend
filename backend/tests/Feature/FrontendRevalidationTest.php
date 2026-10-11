<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FrontendRevalidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_writes_tell_the_website_to_refresh_but_reads_do_not(): void
    {
        config(['services.frontend.revalidate_url' => 'https://site.test/api/revalidate', 'services.frontend.revalidate_secret' => 'shh']);
        Http::fake(['site.test/*' => Http::response(['ok' => true])]);
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));

        $this->getJson('/api/v1/admin/categories')->assertOk();
        Http::assertNothingSent();

        $this->postJson('/api/v1/admin/categories', ['name' => 'Bronze Sculptures'])->assertCreated();
        $this->app->terminate();
        Http::assertSent(fn ($r) => $r->url() === 'https://site.test/api/revalidate' && $r->hasHeader('X-Revalidate-Secret', 'shh'));
    }

    public function test_failed_writes_do_not_trigger_a_refresh(): void
    {
        config(['services.frontend.revalidate_url' => 'https://site.test/api/revalidate', 'services.frontend.revalidate_secret' => 'shh']);
        Http::fake();
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));

        $this->postJson('/api/v1/admin/categories', ['name' => ''])->assertStatus(422);
        $this->app->terminate();
        Http::assertNothingSent();
        $this->assertSame(0, Category::count());
    }
}
