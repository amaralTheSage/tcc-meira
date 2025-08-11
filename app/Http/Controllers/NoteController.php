<?php

namespace App\Http\Controllers;

use App\Events\NodeAdded;
use App\Models\Note;
use App\Models\Project;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function store(Project $project, Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string',
            'x' => 'required|integer',
            'y' => 'required|integer',
        ]);

        $validated['project_id'] = $project->id;

        Note::create($validated);
        broadcast(new NodeAdded($validated['id'], 'Note', $validated['x'], $validated['y'] ))->toOthers();

        return back();
    }

    public function update(Project $project, Note $note, Request $request)
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

        return back()->with('updatedNote', $note);
    }

    public function destroy(Project $project, Note $note)
    {
        // Para não enviar erros caso a nota tenha sido removida antes de ser adicionada ao DB
        if ($note) {
            $note->delete();
        }

        return back();
    }
}
