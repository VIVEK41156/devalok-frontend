<?php

namespace Tests\Feature;

use App\Models\Review;
use App\Models\SiteSetting;
use App\Models\User;
use App\Services\SmtpMailer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SmtpAndReviewsTest extends TestCase
{
    use RefreshDatabase;

    public function test_smtp_is_admin_only(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        $this->getJson('/api/v1/admin/smtp')->assertForbidden();
        $this->putJson('/api/v1/admin/smtp', ['username' => 'a@b.com', 'password' => 'x'])->assertForbidden();
    }

    public function test_failed_connection_is_reported_and_nothing_is_activated(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        // Port 2525 on localhost has no mail server in the test environment.
        $this->putJson('/api/v1/admin/smtp', ['username' => 'owner@example.com', 'password' => 'abcd efgh ijkl mnop', 'host' => '127.0.0.1', 'port' => 2525])
            ->assertStatus(422)
            ->assertJsonPath('data.active', false);
        $this->assertFalse(app(SmtpMailer::class)->isConfigured());
        $this->assertNull(SiteSetting::where('key', 'smtp_password')->value('value'));
    }

    public function test_password_is_stored_encrypted_and_never_returned(): void
    {
        $smtp = app(SmtpMailer::class);
        $smtp->put('smtp_username', 'owner@example.com');
        $smtp->put('smtp_password', Crypt::encryptString('secret-app-pass'));
        $smtp->put('smtp_status', 'active');
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $res = $this->getJson('/api/v1/admin/smtp')->assertOk()->assertJsonPath('data.active', true)->assertJsonPath('data.has_password', true);
        $this->assertStringNotContainsString('secret-app-pass', $res->getContent());
        $this->assertStringNotContainsString('secret-app-pass', (string) SiteSetting::where('key', 'smtp_password')->value('value'));
        // Private SMTP keys never appear in the public settings endpoint.
        $this->getJson('/api/v1/site-settings')->assertJsonMissingPath('data.smtp_username')->assertJsonMissingPath('data.smtp_password');
    }

    public function test_reviews_crud_and_public_visibility(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        $id = $this->postJson('/api/v1/admin/reviews', ['name' => 'Ananya', 'rating' => 5, 'content' => 'Beautiful carving and kind service.'])
            ->assertCreated()->json('data.id');
        $this->postJson('/api/v1/admin/reviews', ['name' => 'X', 'rating' => 9, 'content' => 'short'])->assertStatus(422)->assertJsonValidationErrors(['rating', 'content']);

        $this->getJson('/api/v1/site')->assertJsonPath('data.reviews.0.name', 'Ananya');
        $this->putJson("/api/v1/admin/reviews/{$id}", ['name' => 'Ananya', 'rating' => 4, 'content' => 'Beautiful carving and kind service.', 'is_published' => false])->assertOk();
        $this->getJson('/api/v1/site')->assertJsonCount(0, 'data.reviews');
        $this->deleteJson("/api/v1/admin/reviews/{$id}")->assertOk();
        $this->assertSame(0, Review::count());
    }
}
