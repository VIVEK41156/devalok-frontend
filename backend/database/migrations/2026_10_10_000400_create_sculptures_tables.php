<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sculptures', function (Blueprint $table) {
            $table->id();
            // restrictOnDelete: a category that still has sculptures cannot be dropped.
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('title', 160);
            $table->string('slug', 180)->unique();
            $table->string('subject', 80)->nullable();
            $table->string('short_description', 300)->nullable();
            $table->text('description')->nullable();
            $table->string('materials', 160)->nullable();
            $table->string('dimensions', 120)->nullable();
            $table->string('weight', 60)->nullable();
            $table->text('craftsmanship')->nullable();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->foreignId('cutout_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->json('detail_views')->nullable();
            $table->string('reference_credit', 200)->nullable();
            $table->string('reference_license', 60)->nullable();
            $table->string('reference_url', 500)->nullable();
            $table->boolean('is_featured')->default(false)->index();
            $table->string('status', 16)->default('draft');
            $table->integer('sort_order')->default(0);
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'sort_order']);
        });

        Schema::create('sculpture_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sculpture_id')->constrained('sculptures')->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('media')->cascadeOnDelete();
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['sculpture_id', 'media_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sculpture_images');
        Schema::dropIfExists('sculptures');
    }
};
