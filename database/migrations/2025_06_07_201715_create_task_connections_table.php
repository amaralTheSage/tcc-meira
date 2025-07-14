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
            $table->string('source_id');
            $table->string('target_id');
            $table->foreign('source_id')->references('id')->on('tasks')->cascadeOnDelete();
            $table->foreign('target_id')->references('id')->on('tasks')->cascadeOnDelete();
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
