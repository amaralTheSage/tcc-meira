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
        Schema::create('pins', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();

            $table->float('x')->default(0);
            $table->float('y')->default(0);

            $table->string('title')->nullable();
            $table->text('url')->nullable();

            $table->text('text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pins');
    }
};
