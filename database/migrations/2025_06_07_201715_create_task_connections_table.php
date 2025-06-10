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
        Schema::create('task_connections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('source_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreignId('target_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_connection');
    }
};
