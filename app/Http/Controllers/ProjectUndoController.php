<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\ProjectUndo\ProjectUndoApplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectUndoController extends Controller
{
    /**
     * Undo the current user's latest undoable project-board action.
     *
     * Example: POST /{project}/undo.
     */
    public function store(Project $project, Request $request, ProjectUndoApplier $undo): RedirectResponse
    {
        $result = $undo->undoLatest($project, $request->user());

        if ($result->conflict) {
            return back()->withErrors(['projectUndo' => $result->message]);
        }

        return back()->with('projectUndoStatus', $result->message);
    }
}
