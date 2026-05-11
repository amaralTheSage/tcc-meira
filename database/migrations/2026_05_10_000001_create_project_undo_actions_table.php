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
        Schema::create('project_undo_actions', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('action_type', 80);
            $table->string('action_label', 160);
            $table->json('undo_payload');
            $table->timestamp('undone_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'user_id', 'undone_at', 'created_at'], 'project_undo_latest_index');
            $table->index(['project_id', 'undone_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_undo_actions');
    }
};
