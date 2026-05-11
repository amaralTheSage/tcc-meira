<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Note;
use App\Models\Project;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    use GuardsProjectResources;

    /**
     * Create a traceboard note.
     *
     * Example: POST /{project}/traceboard/notes.
     */
    public function store(Project $project, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $validated['project_id'] = $project->id;

        $note = $this->storedNoteForPayload($project, $validated);

        if ($note->wasRecentlyCreated) {
            $this->broadcastNoteAdded($note);
            $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_NOTE, 'Create note', 'note', $snapshots->note($note->fresh()));
        }

        return back();
    }

    /**
     * Update a note's text or position.
     *
     * Example: PATCH /{project}/update-note/{note}.
     */
    public function update(Project $project, string $note, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate([
            'text' => 'sometimes|string|max:135',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
        ]);

        $noteModel = $this->traceboardNoteForWrite($project, $note, $validated);
        $before = $noteModel->wasRecentlyCreated ? null : $snapshots->note($noteModel);
        $noteModel->update($this->noteUpdates($noteModel, $validated));
        $this->recordNoteUpdate($project, $request, $undo, $snapshots, $noteModel, $before);

        // ---- Broadcasting Events
        $this->broadcastNoteAddedIfNeeded($noteModel);
        if ($request->text) {
            broadcast(new NodeRenamed($noteModel->id, 'Note', $request->text))->toOthers();
        }

        return back()->with('updatedNote', $noteModel);
    }

    /**
     * Persist a note position after a traceboard drag.
     *
     * Example: PATCH /{project}/move-note/{note}.
     */
    public function move(Project $project, string $note, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $userId = $request->user()->id;
        $validated = $this->validatedMovePayload($request);

        $noteModel = $this->traceboardNoteForWrite($project, $note, $validated);
        $before = $this->moveStartSnapshot($snapshots->note($noteModel), $validated);
        $noteModel->update($this->movePosition($validated));

        $this->broadcastNoteAddedIfNeeded($noteModel);
        $this->recordNoteMove($project, $request, $undo, $snapshots, $noteModel, $before, $validated);
        broadcast(new NodeDragged($noteModel->id, 'Note', $request->x, $request->y, $userId))->toOthers();

        return back();
    }

    /**
     * Delete a traceboard note.
     *
     * Example: DELETE /{project}/delete-note/{note}.
     */
    public function destroy(Project $project, string $note, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $noteModel = Note::find($note);

        // Para não enviar erros caso a nota tenha sido removida antes de ser adicionada ao DB
        if ($noteModel) {
            $this->ensureModelBelongsToProject($project, $noteModel);
            $before = $snapshots->note($noteModel);
            $noteModel->delete();
            $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_NOTE, 'Delete note', 'note', $before);
            broadcast(new NodeRemoved($note, 'Note'))->toOthers();
        }

        return back();
    }

    /**
     * @param  array<string, int|string>  $validated
     */
    private function storedNoteForPayload(Project $project, array $validated): Note
    {
        $note = Note::find($validated['id']);
        if ($note !== null) {
            $this->ensureModelBelongsToProject($project, $note);

            return $note;
        }

        return Note::create(array_merge($validated, ['project_id' => $project->id]));
    }

    /**
     * @param  array<string, int|string>  $values
     */
    private function traceboardNoteForWrite(Project $project, string $noteId, array $values): Note
    {
        $note = Note::find($noteId);
        if ($note !== null) {
            $this->ensureModelBelongsToProject($project, $note);

            return $note;
        }

        return Note::create($this->placeholderNotePayload($project, $noteId, $values));
    }

    /**
     * @param  array<string, int|string>  $values
     * @return array<string, int|string|null>
     */
    private function placeholderNotePayload(Project $project, string $noteId, array $values): array
    {
        return [
            'id' => $noteId,
            'project_id' => $project->id,
            'text' => $values['text'] ?? null,
            'x' => $values['x'] ?? 0,
            'y' => $values['y'] ?? 0,
        ];
    }

    /**
     * @param  array<string, int|string>  $validated
     * @return array<string, int|string|null>
     */
    private function noteUpdates(Note $note, array $validated): array
    {
        return [
            'text' => $validated['text'] ?? $note->text,
            'x' => $validated['x'] ?? $note->x,
            'y' => $validated['y'] ?? $note->y,
        ];
    }

    /**
     * @return array{x: int, y: int, _undoable?: bool, _undo_before?: array{x: int, y: int}}
     */
    private function validatedMovePayload(Request $request): array
    {
        return $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer',
            '_undoable' => 'sometimes|boolean',
            '_undo_before' => 'sometimes|array',
            '_undo_before.x' => 'required_with:_undo_before|integer',
            '_undo_before.y' => 'required_with:_undo_before|integer',
        ]);
    }

    private function moveStartSnapshot(array $before, array $validated): array
    {
        if (! isset($validated['_undo_before'])) {
            return $before;
        }

        $before['attributes']['x'] = $validated['_undo_before']['x'];
        $before['attributes']['y'] = $validated['_undo_before']['y'];

        return $before;
    }

    /**
     * @return array{x: int, y: int}
     */
    private function movePosition(array $validated): array
    {
        return ['x' => $validated['x'], 'y' => $validated['y']];
    }

    private function recordNoteUpdate(
        Project $project,
        Request $request,
        ProjectUndoRecorder $undo,
        ProjectBoardSnapshotter $snapshots,
        Note $note,
        ?array $before
    ): void {
        $after = $snapshots->note($note->fresh());

        $before === null
            ? $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_NOTE, 'Create note', 'note', $after)
            : $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_NOTE, 'Update note', 'note', $before, $after);
    }

    private function recordNoteMove(
        Project $project,
        Request $request,
        ProjectUndoRecorder $undo,
        ProjectBoardSnapshotter $snapshots,
        Note $note,
        array $before,
        array $validated
    ): void {
        if (! ($validated['_undoable'] ?? false)) {
            return;
        }

        $after = $snapshots->note($note->fresh());
        $undo->recordTraceboardMove($project, $request->user(), ProjectUndoActionType::MOVE_NOTE, 'Move note', 'note', $before, $after);
    }

    private function broadcastNoteAddedIfNeeded(Note $note): void
    {
        if (! $note->wasRecentlyCreated) {
            return;
        }

        $this->broadcastNoteAdded($note);
    }

    private function broadcastNoteAdded(Note $note): void
    {
        broadcast(new NodeAdded($note->id, 'Note', (int) $note->x, (int) $note->y))->toOthers();
    }
}
