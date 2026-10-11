<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 190);
            $table->string('phone', 40)->nullable();
            $table->string('subject', 200);
            $table->text('message');
            $table->string('status', 20)->default('new')->index();
            $table->foreignId('sculpture_id')->nullable()->constrained('sculptures')->nullOnDelete();
            // SHA-256 of the client IP: enough to spot abuse without storing the raw address.
            $table->string('ip_hash', 64)->nullable();
            $table->foreignId('handled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_enquiries');
    }
};
