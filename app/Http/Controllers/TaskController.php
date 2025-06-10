<?php

namespace App\Http\Controllers;

use App\Models\Project;
use Inertia\Inertia;

class TaskController extends Controller
{
    public function index(Project $project)
    {
        return Inertia::render('traceboard', ['tasks' => $project->tasks]);
    }
}
