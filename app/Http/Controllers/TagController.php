<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * Attach an existing tag to a task.
     *
     * Example: POST /{project}/apply-tag with task_id and tag_id.
     */
    public function applyTag(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate($this->taskTagRules());
        $task = Task::findOrFail($validated['task_id']);

        if (! $task->tags()->where('tag_id', $validated['tag_id'])->exists()) {
            $task->tags()->attach($validated['tag_id']);
        }

        return back();
    }

    /**
     * Detach a tag from a task.
     *
     * Example: POST /{project}/detach-tag with task_id and tag_id.
     */
    public function detachTag(Project $project, Request $request): RedirectResponse
    {
        $validated = $request->validate($this->taskTagRules());

        Task::findOrFail($validated['task_id'])->tags()->detach($validated['tag_id']);

        return back();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate($this->tagRules());

        $tag = Tag::create([
            'name' => $validated['name'],
            'color' => $validated['color'],
            'project_id' => $project->id,
        ]);

        return back()->with(['tag' => $tag]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project, string $tag): RedirectResponse
    {
        $validated = $request->validate($this->tagRules());

        Tag::findOrFail($tag)->update($validated);

        return back()->with('success', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, string $tag): RedirectResponse
    {
        Tag::findOrFail($tag)->delete();

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
