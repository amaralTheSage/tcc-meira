<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Pin;
use App\Models\Project;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Exists;
use Inertia\Inertia;
use Inertia\Response;

class PinController extends Controller
{
    use GuardsProjectResources;

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
    public function store(Request $request, Project $project, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->storeRules());
        $pin = $validated['type'] === 'link'
            ? $this->createLinkPin($project, $validated)
            : $this->createTextPin($project, $validated);
        $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_PIN, 'Create pin', 'pin', $snapshots->pin($pin->fresh()));

        return back();
    }

    /**
     * Move a pin to a new board position.
     *
     * Example: PATCH /{project}/pins/move/{pin}.
     */
    public function move(Project $project, Pin $pin, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $pin);

        $validated = $request->validate(['position' => ['required', 'integer']]);
        $before = $snapshots->pin($pin);
        $pin->update(['position' => $validated['position']]);
        $after = $snapshots->pin($pin->fresh());
        $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::MOVE_PIN, 'Move pin', 'pin', $before, $after);

        return back();
    }

    /**
     * Persist a batch of pin positions as one undoable action.
     *
     * Example: PATCH /{project}/pins/reorder.
     */
    public function reorder(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->reorderRules($project));
        $pinIds = collect($validated['pins'])->pluck('id')->all();
        $before = $snapshots->pinOrderState($project, $pinIds);

        DB::transaction(fn () => $this->updatePinOrder($validated['pins']));

        $after = $snapshots->pinOrderState($project, $pinIds);
        $undo->recordReorder($project, $request->user(), ProjectUndoActionType::REORDER_PINS, 'pins', $before, $after);

        return back();
    }

    /**
     * Delete a pin.
     *
     * Example: DELETE /{project}/pins/{pin}.
     */
    public function destroy(Project $project, Pin $pin, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $this->ensureModelBelongsToProject($project, $pin);
        $before = $snapshots->pin($pin);
        $pin->delete();
        $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_PIN, 'Delete pin', 'pin', $before);

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
     * @return array<string, array<int, string|Exists>|string>
     */
    private function reorderRules(Project $project): array
    {
        return [
            'pins' => ['required', 'array'],
            'pins.*.id' => ['required', 'string', $this->projectPinRule($project)],
            'pins.*.position' => ['required', 'integer'],
        ];
    }

    private function projectPinRule(Project $project): Exists
    {
        return Rule::exists('pins', 'id')
            ->where(fn ($query) => $query->where('project_id', $project->id));
    }

    /**
     * @param  array<string, int|string|null>  $validated
     */
    private function createLinkPin(Project $project, array $validated): Pin
    {
        return Pin::create([
            'title' => $validated['title'] ?? null,
            'url' => $validated['url'] ?? null,
            'project_id' => $project->id,
            'position' => $validated['position'],
        ]);
    }

    /**
     * @param  array<string, int|string|null>  $validated
     */
    private function createTextPin(Project $project, array $validated): Pin
    {
        return Pin::create([
            'text' => $validated['text'] ?? null,
            'project_id' => $project->id,
            'position' => $validated['position'],
        ]);
    }

    /**
     * @param  array<int, array{id: string, position: int}>  $pins
     */
    private function updatePinOrder(array $pins): void
    {
        foreach ($pins as $pin) {
            Pin::where('id', $pin['id'])->update(['position' => $pin['position']]);
        }
    }
}
