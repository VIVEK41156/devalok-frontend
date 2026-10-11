<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ThemeTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_saves_colours_and_site_receives_them(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson('/api/v1/admin/theme', ['palette' => ['gold' => '#B8860B'], 'sections' => ['footer' => '#112233', 'unknown_key' => '#000000']])
            ->assertOk()->assertJsonPath('data.sections.footer', '#112233')->assertJsonMissingPath('data.sections.unknown_key');
        $this->getJson('/api/v1/site')->assertJsonPath('data.settings.theme.palette.gold', '#b8860b')->assertJsonPath('data.settings.theme.sections.footer', '#112233');
    }

    public function test_css_injection_is_rejected(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->putJson('/api/v1/admin/theme', ['palette' => [], 'sections' => ['footer' => 'red;}</style><script>alert(1)</script>']])
            ->assertStatus(422)->assertJsonValidationErrors('sections.footer');
    }

    public function test_editors_cannot_change_theme(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        $this->putJson('/api/v1/admin/theme', ['palette' => [], 'sections' => []])->assertForbidden();
    }
}
