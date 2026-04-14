<?php

use App\Enums\ProjectVisibility;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->string('visibility')->default(ProjectVisibility::PRIVATE->value)->index();
            $table->string('share_token')->nullable()->unique();
            $table->unsignedBigInteger('public_views_count')->default(0);
            $table->timestamp('published_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['visibility', 'share_token', 'public_views_count', 'published_at']);
        });
    }
};
