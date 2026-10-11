<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('location', 120)->nullable();
            $table->unsignedTinyInteger('rating')->default(5);
            $table->text('content');
            $table->foreignId('sculpture_id')->nullable()->constrained('sculptures')->nullOnDelete();
            $table->foreignId('avatar_media_id')->nullable()->constrained('media')->nullOnDelete();
            // Placeholder content added for the demo; shown with a "Sample" tag until replaced.
            $table->boolean('is_sample')->default(false);
            $table->boolean('is_published')->default(true)->index();
            $table->integer('sort_order')->default(0)->index();
            $table->timestamps();
        });

        Schema::table('contact_enquiries', function (Blueprint $table) {
            $table->timestamp('notified_at')->nullable()->after('handled_by');
            $table->string('notify_error', 255)->nullable()->after('notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('contact_enquiries', function (Blueprint $table) {
            $table->dropColumn(['notified_at', 'notify_error']);
        });
        Schema::dropIfExists('reviews');
    }
};
