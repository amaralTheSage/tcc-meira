<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class ProjectDocsController extends Controller
{
    /**
     * Render the project documentation workspace.
     *
     * Example: GET /{project}/docs.
     */
    public function show(Project $project): Response
    {
        return Inertia::render('project/docs', [
            'project' => $project,
        ]);
    }
}
