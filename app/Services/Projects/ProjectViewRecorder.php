<?php

namespace App\Services\Projects;

use App\Models\Project;
use App\Models\ProjectView;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ProjectViewRecorder
{
    /**
     * Count one unique daily non-member visit to a shared project.
     *
     * Example: $recorder->record($project, $request).
     */
    public function record(Project $project, Request $request): void
    {
        if ($this->isProjectMember($project, $request->user())) {
            return;
        }

        $created = ProjectView::query()->insertOrIgnore($this->viewAttributes($project, $request));

        if ($created === 1) {
            $project->increment('public_views_count');
        }
    }

    private function isProjectMember(Project $project, ?User $user): bool
    {
        return $user !== null && $project->members()->whereKey($user->id)->exists();
    }

    /**
     * @return array{project_id: string, visitor_hash: string, viewed_on: string, created_at: Carbon, updated_at: Carbon}
     */
    private function viewAttributes(Project $project, Request $request): array
    {
        return [
            'project_id' => $project->id,
            'visitor_hash' => $this->visitorHash($request),
            'viewed_on' => now()->toDateString(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    private function visitorHash(Request $request): string
    {
        $identity = $request->user()?->getAuthIdentifier()
            ?? ($request->ip().'|'.($request->userAgent() ?? 'unknown'));

        return hash_hmac('sha256', (string) $identity, config('app.key', 'meira'));
    }
}
