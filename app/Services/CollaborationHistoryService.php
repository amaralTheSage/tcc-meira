<?php

namespace App\Services;

use App\Models\Project;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Database\Query\JoinClause;
use Illuminate\Support\Facades\DB;

class CollaborationHistoryService
{
    /**
     * Record every collaborator pair for a newly accepted project member.
     *
     * Example: $history->recordProjectMembership($project->id, $user->id).
     */
    public function recordProjectMembership(string $projectId, int $memberId): void
    {
        $memberIds = $this->projectMemberIds($projectId);
        $rows = $this->rowsForMember($projectId, $memberId, $memberIds);

        if ($rows === []) {
            return;
        }

        DB::table('project_collaborations')->upsert(
            $rows,
            ['project_id', 'user_id', 'collaborator_id'],
            ['last_collaborated_at', 'updated_at'],
        );
    }

    /**
     * Rank a user query so prior collaborators appear before other users.
     *
     * Example: $history->rankUsersFor($viewer, User::query())->limit(20)->get().
     */
    public function rankUsersFor(User $viewer, Builder $query): Builder
    {
        return $query
            ->leftJoinSub($this->collaborationStatsQuery($viewer), 'collaboration_stats', $this->joinStats(...))
            ->addSelect($this->userColumns())
            ->selectRaw('COALESCE(collaboration_stats.shared_projects_count, 0) as shared_projects_count')
            ->selectRaw('CASE WHEN collaboration_stats.shared_projects_count IS NULL THEN 0 ELSE 1 END as has_collaborated')
            ->orderByDesc('has_collaborated')
            ->orderByDesc('shared_projects_count')
            ->orderBy('users.name');
    }

    /**
     * Return user IDs for people who previously collaborated with the user.
     *
     * Example: $history->collaboratorIdsFor($user).
     *
     * @return array<int, int>
     */
    public function collaboratorIdsFor(User $user): array
    {
        return DB::table('project_collaborations')
            ->where('user_id', $user->id)
            ->distinct()
            ->pluck('collaborator_id')
            ->map(fn (int|string $id): int => (int) $id)
            ->all();
    }

    /**
     * Rebuild collaboration rows from current project membership rows.
     *
     * Example: $history->backfillExistingMemberships().
     */
    public function backfillExistingMemberships(): void
    {
        Project::query()
            ->select(['id'])
            ->orderBy('id')
            ->each(fn (Project $project): bool => $this->backfillProject($project));
    }

    private function backfillProject(Project $project): bool
    {
        $project->members()
            ->pluck('users.id')
            ->each(fn (int $memberId) => $this->recordProjectMembership($project->id, $memberId));

        return true;
    }

    /**
     * @return array<int, int>
     */
    private function projectMemberIds(string $projectId): array
    {
        return DB::table('project_user')
            ->where('project_id', $projectId)
            ->pluck('user_id')
            ->unique()
            ->map(fn (int|string $id): int => (int) $id)
            ->all();
    }

    /**
     * @param  array<int, int>  $memberIds
     * @return array<int, array<string, int|string|object>>
     */
    private function rowsForMember(string $projectId, int $memberId, array $memberIds): array
    {
        $now = now();

        return collect($memberIds)
            ->reject(fn (int $collaboratorId): bool => $collaboratorId === $memberId)
            ->flatMap(fn (int $collaboratorId): array => [
                $this->row($projectId, $memberId, $collaboratorId, $now),
                $this->row($projectId, $collaboratorId, $memberId, $now),
            ])
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

    private function collaborationStatsQuery(User $viewer): QueryBuilder
    {
        return DB::table('project_collaborations')
            ->select('collaborator_id')
            ->selectRaw('COUNT(DISTINCT project_id) as shared_projects_count')
            ->where('user_id', $viewer->id)
            ->groupBy('collaborator_id');
    }

    private function joinStats(JoinClause $join): void
    {
        $join->on('users.id', '=', 'collaboration_stats.collaborator_id');
    }

    /**
     * @return array<int, string>
     */
    private function userColumns(): array
    {
        return ['users.id', 'users.name', 'users.email', 'users.avatar', 'users.email_verified_at'];
    }
}
