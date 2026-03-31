<?php

namespace App\Http\Controllers;

use App\Models\Pin;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PinController extends Controller
{
    /**
     * Render the project pin board.
     *
     * Example: GET /{project}/pins.
     */
    public function index(Project $project): Response
    {
        $pins = Pin::where('project_id', $project->id)->orderBy('position', 'asc')->get();

        return Inertia::render('project/pins', ['project' => $project, 'pins' => $pins]);
    }

    /**
     * Create a text or link pin.
     *
     * Example: POST /{project}/pins.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate($this->storeRules());
        $validated['type'] === 'link'
            ? $this->createLinkPin($project, $validated)
            : $this->createTextPin($project, $validated);

        return back();
    }

    /**
     * Move a pin to a new board position.
     *
     * Example: PATCH /{project}/pins/move/{pin}.
     */
    public function move(Project $project, Pin $pin, Request $request): RedirectResponse
    {
        $validated = $request->validate(['position' => ['required', 'integer']]);
        $pin->update(['position' => $validated['position']]);

        return back();
    }

    /**
     * Delete a pin.
     *
     * Example: DELETE /{project}/pins/{pin}.
     */
    public function destroy(Project $project, Pin $pin): RedirectResponse
    {
        $pin->delete();

        return back();
    }

    /**
     * @return array<string, string>
     */
    private function storeRules(): array
    {
        return [
            'type' => 'in:text,link|required',
            'text' => 'sometimes|string|max:2800',
            'title' => 'sometimes|string|max:140',
            'url' => 'sometimes|string|max:4000',
            'position' => 'required|integer',
        ];
    }

    /**
     * @param  array<string, int|string|null>  $validated
     */
    private function createLinkPin(Project $project, array $validated): void
    {
        Pin::create([
            'title' => $validated['title'] ?? null,
            'url' => $validated['url'] ?? null,
            'project_id' => $project->id,
            'position' => $validated['position'],
        ]);
    }

    /**
     * @param  array<string, int|string|null>  $validated
     */
    private function createTextPin(Project $project, array $validated): void
    {
        Pin::create([
            'text' => $validated['text'] ?? null,
            'project_id' => $project->id,
            'position' => $validated['position'],
        ]);
    }
}
