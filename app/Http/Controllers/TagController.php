<?php

namespace App\Http\Controllers;

use App\Enums\ProjectUndoActionType;
use App\Http\Controllers\Concerns\GuardsProjectResources;
use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use App\Services\ProjectUndo\ProjectBoardSnapshotter;
use App\Services\ProjectUndo\ProjectUndoRecorder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    use GuardsProjectResources;

    /**
     * Attach an existing tag to a task.
     *
     * Example: POST /{project}/apply-tag with task_id and tag_id.
     */
    public function applyTag(Project $project, Request $request, ProjectUndoRecorder $undo): RedirectResponse
    {
        $validated = $request->validate($this->taskTagRules());
        $task = Task::findOrFail($validated['task_id']);
        $tag = Tag::findOrFail($validated['tag_id']);

        $this->ensureTaskBelongsToProject($project, $task);
        $this->ensureModelBelongsToProject($project, $tag);

        if (! $task->tags()->where('tag_id', $validated['tag_id'])->exists()) {
            $task->tags()->attach($validated['tag_id']);
            $undo->recordRelation($project, $request->user(), ProjectUndoActionType::ATTACH_TASK_TAG, 'Apply task tag', [
                'relation' => 'tag_task',
                'keys' => ['task_id' => $task->id, 'tag_id' => $tag->id],
                'after_exists' => true,
            ]);
        }

        return back();
    }

    /**
     * Detach a tag from a task.
     *
     * Example: POST /{project}/detach-tag with task_id and tag_id.
     */
    public function detachTag(Project $project, Request $request, ProjectUndoRecorder $undo): RedirectResponse
    {
        $validated = $request->validate($this->taskTagRules());
        $task = Task::findOrFail($validated['task_id']);
        $tag = Tag::findOrFail($validated['tag_id']);

        $this->ensureTaskBelongsToProject($project, $task);
        $this->ensureModelBelongsToProject($project, $tag);

        $wasTagged = $task->tags()->where('tag_id', $validated['tag_id'])->exists();
        $task->tags()->detach($validated['tag_id']);

        if ($wasTagged) {
            $undo->recordRelation($project, $request->user(), ProjectUndoActionType::DETACH_TASK_TAG, 'Remove task tag', [
                'relation' => 'tag_task',
                'keys' => ['task_id' => $task->id, 'tag_id' => $tag->id],
                'after_exists' => false,
            ]);
        }

        return back();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->tagRules());

        $tag = Tag::create([
            'name' => $validated['name'],
            'color' => $validated['color'],
            'project_id' => $project->id,
        ]);
        $undo->recordCreated($project, $request->user(), ProjectUndoActionType::CREATE_TAG, 'Create tag', 'tag', $snapshots->tag($tag->fresh()));

        return back()->with(['tag' => $tag]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project, string $tag, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $validated = $request->validate($this->tagRules());
        $projectTag = Tag::findOrFail($tag);

        $this->ensureModelBelongsToProject($project, $projectTag);
        $before = $snapshots->tag($projectTag);
        $projectTag->update($validated);
        $after = $snapshots->tag($projectTag->fresh());
        $undo->recordUpdated($project, $request->user(), ProjectUndoActionType::UPDATE_TAG, 'Update tag', 'tag', $before, $after);

        return back()->with('success', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, string $tag, Request $request, ProjectUndoRecorder $undo, ProjectBoardSnapshotter $snapshots): RedirectResponse
    {
        $projectTag = Tag::findOrFail($tag);

        $this->ensureModelBelongsToProject($project, $projectTag);
        $before = $snapshots->tag($projectTag);
        $projectTag->delete();
        $undo->recordDeleted($project, $request->user(), ProjectUndoActionType::DELETE_TAG, 'Delete tag', 'tag', $before);

        return back()->with('success', 'Tag deleted successfully');
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function tagRules(): array
    {
        return ['name' => ['required', 'string', 'max:80'], 'color' => ['required', 'string', 'size:7']];
    }

    /**
     * @return array<string, array<int, string>>
     */
    private function taskTagRules(): array
    {
        return ['task_id' => ['required', 'string', 'exists:tasks,id'], 'tag_id' => ['required', 'string', 'exists:tags,id']];
    }
}
