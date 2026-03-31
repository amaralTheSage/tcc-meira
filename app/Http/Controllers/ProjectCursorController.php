<?php

namespace App\Http\Controllers;

use App\Events\CursorMoved;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ProjectCursorController extends Controller
{
    /**
     * Broadcast the current member cursor position.
     *
     * Example: POST /{project}/cursor with x and y integers.
     */
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        broadcast(new CursorMoved($validated['x'], $validated['y'], $request->user()->id))->toOthers();

        return back();
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function rules(): array
    {
        return [
            'x' => ['required', 'integer'],
            'y' => ['required', 'integer'],
        ];
    }
}
