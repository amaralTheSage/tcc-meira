<?php

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
        Schema::create('project_views', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_hash', 64);
            $table->date('viewed_on');
            $table->timestamps();

            $table->unique(['project_id', 'visitor_hash', 'viewed_on']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_views');
    }
};
