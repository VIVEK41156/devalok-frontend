<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pages', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 60)->unique();
            $table->string('title', 160);
            $table->text('intro')->nullable();
            $table->longText('content')->nullable();
            $table->foreignId('featured_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->string('canonical_url', 500)->nullable();
            $table->string('og_title', 160)->nullable();
            $table->string('og_description', 320)->nullable();
            $table->foreignId('og_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('status', 16)->default('published')->index();
            $table->timestamps();
        });

        Schema::create('page_sections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('page_id')->constrained('pages')->cascadeOnDelete();
            $table->string('section_key', 60);
            $table->string('label', 80)->nullable();
            $table->string('eyebrow', 120)->nullable();
            $table->string('heading', 200)->nullable();
            $table->string('heading_accent', 200)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->string('cta_label', 60)->nullable();
            $table->string('cta_url', 500)->nullable();
            $table->boolean('is_visible')->default(true);
            $table->integer('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['page_id', 'section_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('page_sections');
        Schema::dropIfExists('pages');
    }
};
