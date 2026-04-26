<?php

namespace App\Http\Middleware;

use App\Models\Project;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProjectMember
{
    /**
     * Allow only members of the routed project to continue.
     *
     * Example: GET /{project}/traceboard requires membership in {project}.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $projectId = $this->projectId($request);

        abort_unless(Project::whereKey($projectId)->exists(), 404);
        abort_unless($request->user()?->projects()->whereKey($projectId)->exists(), 403);

        return $next($request);
    }

    private function projectId(Request $request): string
    {
        $project = $request->route('project');

        return $project instanceof Project ? (string) $project->id : (string) $project;
    }
}
