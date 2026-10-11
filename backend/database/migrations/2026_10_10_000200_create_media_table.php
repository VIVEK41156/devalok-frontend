<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media', function (Blueprint $table) {
            $table->id();
            $table->string('disk', 32)->default('public');
            $table->string('path', 255)->unique();
            $table->string('original_name', 255);
            $table->string('title', 160)->nullable()->index();
            $table->string('alt', 255)->nullable();
            $table->string('caption', 500)->nullable();
            $table->string('mime', 64);
            $table->unsignedInteger('size');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media');
    }
};
