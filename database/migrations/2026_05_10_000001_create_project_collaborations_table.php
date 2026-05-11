<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('project_collaborations', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('collaborator_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('first_collaborated_at');
            $table->timestamp('last_collaborated_at');
            $table->timestamps();

            $table->unique(['project_id', 'user_id', 'collaborator_id'], 'project_collaborations_unique_pair');
            $table->index(['user_id', 'last_collaborated_at']);
        });

        $this->backfillExistingMemberships();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_collaborations');
    }

    private function backfillExistingMemberships(): void
    {
        DB::table('project_user')
            ->select(['project_id'])
            ->distinct()
            ->orderBy('project_id')
            ->each(fn (object $project): bool => $this->backfillProject($project->project_id));
    }

    private function backfillProject(string $projectId): bool
    {
        $memberIds = DB::table('project_user')->where('project_id', $projectId)->pluck('user_id')->unique()->all();
        $rows = $this->collaborationRows($projectId, $memberIds);

        if ($rows !== []) {
            DB::table('project_collaborations')->insert($rows);
        }

        return true;
    }

    /**
     * @param  array<int, int>  $memberIds
     * @return array<int, array<string, int|string|object>>
     */
    private function collaborationRows(string $projectId, array $memberIds): array
    {
        $now = now();

        return collect($memberIds)
            ->flatMap(fn (int $userId) => collect($memberIds)
                ->reject(fn (int $collaboratorId): bool => $collaboratorId === $userId)
                ->map(fn (int $collaboratorId): array => $this->row($projectId, $userId, $collaboratorId, $now)))
            ->values()
            ->all();
    }

    private function row(string $projectId, int $userId, int $collaboratorId, object $now): array
    {
        return [
            'project_id' => $projectId,
            'user_id' => $userId,
            'collaborator_id' => $collaboratorId,
            'first_collaborated_at' => $now,
            'last_collaborated_at' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ];
    }
};
