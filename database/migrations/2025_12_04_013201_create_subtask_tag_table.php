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
        Schema::create('subtask_tag', function (Blueprint $table) {
            $table->id();
            $table->string('tag_id');
            $table->foreign('tag_id')->references('id')->on('tags')->cascadeOnDelete();
            $table->string('subtask_id');
            $table->foreign('subtask_id')->references('id')->on('subtasks')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subtask_tag');
    }
};
