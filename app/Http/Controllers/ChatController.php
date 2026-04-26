<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * Render the project team chat.
     *
     * Example: GET /{project}/team-chat.
     */
    public function index(Project $project): Response
    {
        return Inertia::render('project/team-chat', [
            'project' => $project->load(['chat.messages' => function ($query): void {
                $query->orderBy('created_at', 'asc')->with('user');
            }, 'members']),
        ]);
    }
}
