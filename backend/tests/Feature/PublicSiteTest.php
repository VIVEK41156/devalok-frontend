<?php

namespace Tests\Feature;

use App\Models\Page;
use App\Models\SiteSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PublicSiteTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_enquiry_is_validated_stored_and_rate_limited(): void
    {
        $this->postJson('/api/v1/contact-enquiries', ['name' => 'A', 'email' => 'not-an-email', 'subject' => '', 'message' => 'short'])
            ->assertStatus(422)->assertJsonValidationErrors(['name', 'email', 'subject', 'message']);

        $ok = ['name' => 'Asha Rao', 'email' => 'asha@example.com', 'subject' => 'Ganapati', 'message' => 'I would like to know more about this piece.'];
        $this->postJson('/api/v1/contact-enquiries', $ok)->assertCreated();
        $this->assertDatabaseHas('contact_enquiries', ['email' => 'asha@example.com', 'status' => 'new']);

        // Honeypot field filled → rejected
        $this->postJson('/api/v1/contact-enquiries', $ok + ['website' => 'spam.example'])->assertStatus(422);

        // 3 per minute per IP (one valid + two rejected above count too)
        $this->postJson('/api/v1/contact-enquiries', $ok)->assertStatus(429);
    }

    public function test_page_updates_are_visible_publicly_and_drafts_are_hidden(): void
    {
        $page = Page::create(['slug' => 'about', 'title' => 'About Us', 'status' => 'published']);
        $section = $page->sections()->create(['section_key' => 'hero', 'heading' => 'Old', 'is_visible' => true]);
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));

        $this->putJson("/api/v1/admin/pages/{$page->id}", ['title' => 'About Devalok', 'intro' => '<script>x</script>Hello', 'status' => 'published'])->assertOk();
        $this->putJson("/api/v1/admin/pages/{$page->id}/sections/{$section->id}", ['heading' => 'Where devotion', 'cta_url' => 'javascript:alert(1)'])
            ->assertStatus(422)->assertJsonValidationErrors('cta_url');
        $this->putJson("/api/v1/admin/pages/{$page->id}/sections/{$section->id}", ['heading' => 'Where devotion', 'cta_url' => '/gallery', 'is_visible' => true])->assertOk();

        $this->getJson('/api/v1/pages/about')->assertOk()
            ->assertJsonPath('data.title', 'About Devalok')
            ->assertJsonPath('data.intro', 'xHello')
            ->assertJsonPath('data.sections.0.heading', 'Where devotion');

        $this->putJson("/api/v1/admin/pages/{$page->id}", ['title' => 'About Devalok', 'status' => 'draft'])->assertOk();
        $this->getJson('/api/v1/pages/about')->assertNotFound();
    }

    public function test_public_settings_never_include_private_keys(): void
    {
        SiteSetting::create(['key' => 'contact_email', 'value' => 'info@devaloksculptures.in', 'is_public' => true]);
        SiteSetting::create(['key' => 'enquiry_notification_email', 'value' => 'private@example.com', 'is_public' => false]);
        $this->getJson('/api/v1/site-settings')->assertOk()
            ->assertJsonPath('data.contact_email', 'info@devaloksculptures.in')
            ->assertJsonMissingPath('data.enquiry_notification_email');
    }

    public function test_menu_rejects_unsafe_urls(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        foreach (['javascript:alert(1)', '//evil.example', 'data:text/html,hi'] as $bad) {
            $this->postJson('/api/v1/admin/menu-items', ['label' => 'Bad', 'url' => $bad, 'location' => 'header'])
                ->assertStatus(422)->assertJsonValidationErrors('url');
        }
        $this->postJson('/api/v1/admin/menu-items', ['label' => 'Gallery', 'url' => '/gallery', 'location' => 'header'])->assertCreated();
        $this->getJson('/api/v1/menus')->assertOk()->assertJsonPath('data.header.0.label', 'Gallery');
    }
}
