<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Media;
use App\Models\Sculpture;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SculptureCmsTest extends TestCase
{
    use RefreshDatabase;

    private Category $stone;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Sanctum::actingAs(User::factory()->create(['role' => 'editor']));
        $this->stone = Category::create(['name' => 'Stone Sculptures', 'slug' => 'stone', 'is_published' => true]);
    }

    private function upload(string $name = 'photo.jpg'): int
    {
        $file = UploadedFile::fake()->image($name, 1200, 1600);
        $res = $this->post('/api/v1/admin/media', ['files' => [$file]], ['Accept' => 'application/json'])->assertCreated();

        return $res->json('data.0.id');
    }

    public function test_full_sculpture_lifecycle_with_images_and_publication(): void
    {
        $cover = $this->upload('cover.jpg');
        $g1 = $this->upload('detail-1.png');
        $g2 = $this->upload('detail-2.jpg');

        // Create as draft
        $id = $this->postJson('/api/v1/admin/sculptures', [
            'title' => 'Seated Ganapati',
            'category_id' => $this->stone->id,
            'status' => 'draft',
            'cover_media_id' => $cover,
            'gallery_media_ids' => [$g1, $g2],
            'short_description' => 'A seated Ganapati.',
        ])->assertCreated()->assertJsonPath('data.slug', 'seated-ganapati')->json('data.id');

        $this->assertDatabaseCount('sculpture_images', 2);

        // Drafts are invisible publicly
        $this->getJson('/api/v1/sculptures')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/sculptures/seated-ganapati')->assertNotFound();

        // Edit + publish, remove one gallery image
        $this->putJson("/api/v1/admin/sculptures/{$id}", [
            'title' => 'Seated Ganapati in Granite',
            'category_id' => $this->stone->id,
            'status' => 'published',
            'cover_media_id' => $cover,
            'gallery_media_ids' => [$g2],
            'is_featured' => true,
        ])->assertOk()->assertJsonPath('data.status', 'published')->assertJsonPath('data.is_featured', true);
        $this->assertDatabaseCount('sculpture_images', 1);

        $public = $this->getJson('/api/v1/sculptures')->assertOk()->assertJsonCount(1, 'data');
        $public->assertJsonMissingPath('data.0.status'); // admin-only fields stay private
        $this->assertStringContainsString('/storage/media/', $public->json('data.0.cover.url'));

        // Unpublish hides it again
        $this->putJson("/api/v1/admin/sculptures/{$id}", ['title' => 'Seated Ganapati in Granite', 'category_id' => $this->stone->id, 'status' => 'draft'])->assertOk();
        $this->getJson('/api/v1/sculptures')->assertJsonCount(0, 'data');

        // Delete
        $this->deleteJson("/api/v1/admin/sculptures/{$id}")->assertOk();
        $this->assertDatabaseMissing('sculptures', ['id' => $id]);
        $this->assertDatabaseCount('sculpture_images', 0);
        $this->assertDatabaseHas('activity_logs', ['action' => 'sculpture.deleted']);
    }

    public function test_validation_errors_are_reported(): void
    {
        $this->postJson('/api/v1/admin/sculptures', ['title' => '', 'status' => 'live'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'category_id', 'status']);
    }

    public function test_slugs_are_unique(): void
    {
        $body = ['title' => 'Nandi', 'category_id' => $this->stone->id, 'status' => 'draft'];
        $this->postJson('/api/v1/admin/sculptures', $body)->assertJsonPath('data.slug', 'nandi');
        $this->postJson('/api/v1/admin/sculptures', $body)->assertJsonPath('data.slug', 'nandi-2');
    }

    public function test_upload_rejects_non_images_svg_and_spoofed_files(): void
    {
        $php = UploadedFile::fake()->createWithContent('shell.php.jpg', '<?php system($_GET["c"]); ?>');
        $this->post('/api/v1/admin/media', ['files' => [$php]], ['Accept' => 'application/json'])->assertStatus(422);

        $svg = UploadedFile::fake()->createWithContent('logo.svg', '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
        $this->post('/api/v1/admin/media', ['files' => [$svg]], ['Accept' => 'application/json'])->assertStatus(422);

        $this->assertDatabaseCount('media', 0);
    }

    public function test_uploaded_files_get_generated_names_and_dimensions(): void
    {
        $id = $this->upload('../../etc/passwd.jpg');
        $media = Media::findOrFail($id);
        $this->assertMatchesRegularExpression('#^media/\d{4}/\d{2}/[0-9a-f-]{36}\.jpg$#', $media->path);
        $this->assertSame(1200, $media->width);
        $this->assertSame(1600, $media->height);
        Storage::disk('public')->assertExists($media->path);
    }

    public function test_media_in_use_cannot_be_deleted(): void
    {
        $id = $this->upload();
        Sculpture::create(['title' => 'X', 'slug' => 'x', 'category_id' => $this->stone->id, 'status' => 'draft', 'cover_media_id' => $id]);
        $this->deleteJson("/api/v1/admin/media/{$id}")->assertStatus(422);
        $this->assertDatabaseHas('media', ['id' => $id]);
    }

    public function test_category_with_sculptures_needs_reassignment_before_delete(): void
    {
        $wood = Category::create(['name' => 'Wood Sculptures', 'slug' => 'wood', 'is_published' => true]);
        $s = Sculpture::create(['title' => 'Krishna', 'slug' => 'krishna', 'category_id' => $this->stone->id, 'status' => 'published']);

        $this->deleteJson("/api/v1/admin/categories/{$this->stone->id}")->assertStatus(422)->assertJsonValidationErrors('reassign_to');
        $this->assertDatabaseHas('categories', ['id' => $this->stone->id]);

        $this->deleteJson("/api/v1/admin/categories/{$this->stone->id}", ['reassign_to' => $wood->id])->assertOk();
        $this->assertSame($wood->id, $s->fresh()->category_id);
    }

    public function test_category_crud_and_public_listing(): void
    {
        $id = $this->postJson('/api/v1/admin/categories', ['name' => 'Marble Sculptures', 'is_published' => false])
            ->assertCreated()->assertJsonPath('data.slug', 'marble-sculptures')->json('data.id');
        $this->getJson('/api/v1/categories')->assertJsonCount(1, 'data'); // only stone is published

        $this->putJson("/api/v1/admin/categories/{$id}", ['name' => 'Marble Sculptures', 'slug' => 'marble', 'is_published' => true])
            ->assertOk()->assertJsonPath('data.slug', 'marble');
        $this->getJson('/api/v1/categories')->assertJsonCount(2, 'data');
    }
}
