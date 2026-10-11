<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('name', 120);
            $table->string('short_name', 60)->nullable();
            $table->string('slug', 140)->unique();
            $table->string('tagline', 200)->nullable();
            $table->text('description')->nullable();
            $table->foreignId('cover_media_id')->nullable()->constrained('media')->nullOnDelete();
            $table->integer('sort_order')->default(0)->index();
            $table->boolean('is_published')->default(true)->index();
            $table->string('seo_title', 160)->nullable();
            $table->string('seo_description', 320)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
