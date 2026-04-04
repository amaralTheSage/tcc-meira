<?php

namespace App\Http\Middleware;

use App\Models\Sprint;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSprintProjectMember
{
    /**
     * Allow only members of the sprint project to use global sprint routes.
     *
     * Example: PATCH /sprints/{sprint}/start requires membership in the sprint project.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $projectId = $this->sprintProjectId($request);

        abort_unless($projectId !== null, 404);
        abort_unless($request->user()?->projects()->whereKey($projectId)->exists(), 403);

        return $next($request);
    }

    private function sprintProjectId(Request $request): ?string
    {
        $sprint = $request->route('sprint');

        if ($sprint instanceof Sprint) {
            return (string) $sprint->project_id;
        }

        $projectId = Sprint::whereKey((string) $sprint)->value('project_id');

        return $projectId === null ? null : (string) $projectId;
    }
}
