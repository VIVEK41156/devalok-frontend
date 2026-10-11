<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    private const SPA = ['Origin' => 'http://localhost', 'Referer' => 'http://localhost/admin/login'];

    private function admin(array $attrs = []): User
    {
        return User::factory()->create(array_merge(['role' => 'admin', 'password' => 'Correct-Horse-42', 'is_active' => true], $attrs));
    }

    public function test_guest_cannot_access_admin_api(): void
    {
        $this->getJson('/api/v1/admin/sculptures')->assertUnauthorized();
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
        $this->postJson('/api/v1/admin/sculptures', [])->assertUnauthorized();
    }

    public function test_wrong_password_is_rejected_with_generic_message(): void
    {
        $user = $this->admin();
        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => $user->email, 'password' => 'nope-nope-nope'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
        $this->assertGuest('web');
    }

    public function test_unknown_email_gets_the_same_generic_message(): void
    {
        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => 'nobody@example.com', 'password' => 'whatever-123'])
            ->assertStatus(422)
            ->assertJsonPath('errors.email.0', 'These credentials do not match our records.');
    }

    public function test_inactive_account_cannot_sign_in(): void
    {
        $user = $this->admin(['is_active' => false]);
        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => $user->email, 'password' => 'Correct-Horse-42'])
            ->assertStatus(422);
        $this->assertGuest('web');
    }

    public function test_successful_login_establishes_session_and_logout_ends_it(): void
    {
        $user = $this->admin();
        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => $user->email, 'password' => 'Correct-Horse-42'])
            ->assertOk()
            ->assertJsonPath('data.email', $user->email)
            ->assertJsonMissingPath('data.password');
        $this->assertAuthenticatedAs($user, 'web');
        $this->assertDatabaseHas('activity_logs', ['action' => 'auth.login', 'user_id' => $user->id]);

        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/logout')->assertOk();
        $this->assertGuest('web');
    }

    public function test_login_is_rate_limited(): void
    {
        $user = $this->admin();
        for ($i = 0; $i < 5; $i++) {
            $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => $user->email, 'password' => 'wrong-'.$i]);
        }
        $this->withHeaders(self::SPA)->postJson('/api/v1/admin/login', ['email' => $user->email, 'password' => 'Correct-Horse-42'])
            ->assertStatus(429);
    }

    public function test_editor_cannot_use_admin_only_endpoints(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        $this->getJson('/api/v1/admin/users')->assertForbidden();
        $this->getJson('/api/v1/admin/settings')->assertForbidden();
        $this->putJson('/api/v1/admin/settings', ['settings' => ['site_name' => 'x']])->assertForbidden();
        $this->getJson('/api/v1/admin/activity-logs')->assertForbidden();
        $this->getJson('/api/v1/admin/sculptures')->assertOk();
    }

    public function test_deactivated_user_loses_access_immediately(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin', 'is_active' => false]));
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();
    }

    public function test_last_active_admin_cannot_be_demoted_or_deactivated(): void
    {
        $admin = $this->admin();
        Sanctum::actingAs($admin);
        $this->putJson("/api/v1/admin/users/{$admin->id}", ['role' => 'editor'])->assertStatus(422);
        $this->putJson("/api/v1/admin/users/{$admin->id}", ['is_active' => false])->assertStatus(422);
        $this->assertSame('admin', $admin->fresh()->role);
    }

    public function test_user_listing_never_exposes_password_hashes(): void
    {
        Sanctum::actingAs($this->admin());
        $this->getJson('/api/v1/admin/users')->assertOk()->assertJsonMissingPath('data.0.password');
    }
}
