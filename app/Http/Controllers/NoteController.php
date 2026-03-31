<?php

namespace App\Http\Controllers;

use App\Events\NodeAdded;
use App\Events\NodeDragged;
use App\Events\NodeRemoved;
use App\Events\NodeRenamed;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    /**
     * Create a traceboard note.
     *
     * Example: POST /{project}/traceboard/notes.
     */
    public function store(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $validated['project_id'] = $project->id;

        Note::create($validated);
        broadcast(new NodeAdded($validated['id'], 'Note', $validated['x'], $validated['y']))->toOthers();

        return back();
    }

    /**
     * Update a note's text or position.
     *
     * Example: PATCH /{project}/update-note/{note}.
     */
    public function update(Project $project, Note $note, Request $request): RedirectResponse
    {
        $request->validate([
            'text' => 'sometimes|string|max:135',
            'x' => 'sometimes|integer',
            'y' => 'sometimes|integer',
        ]);

        $updates = [
            'text' => $request->text ?? $note->text,
            'x' => $request->x ?? $note->x,
            'y' => $request->y ?? $note->y,
        ];

        $note->update($updates);

        // ---- Broadcasting Events
        if ($request->text) {
            broadcast(new NodeRenamed($note->id, 'Note', $request->text))->toOthers();
        }

        return back()->with('updatedNote', $note);
    }

    /**
     * Persist a note position after a traceboard drag.
     *
     * Example: PATCH /{project}/move-note/{note}.
     */
    public function move(Project $project, Note $note, Request $request): RedirectResponse
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $note->update($validated);

        broadcast(new NodeDragged($note->id, 'Note', $request->x, $request->y, $userId))->toOthers();

        return back();
    }

    /**
     * Delete a traceboard note.
     *
     * Example: DELETE /{project}/delete-note/{note}.
     */
    public function destroy(Project $project, Note $note): RedirectResponse
    {
        // Para não enviar erros caso a nota tenha sido removida antes de ser adicionada ao DB
        $note->delete();
        broadcast(new NodeRemoved($note->id, 'Note'))->toOthers();

        return back();
    }
}
