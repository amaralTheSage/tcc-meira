<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use App\Models\Task;
use Illuminate\Http\Request;

class TagController extends Controller
{

    public function apply_tag(Project $project, Request $request)
    {
        $task = Task::find($request['task_id']);
        if (!$task->tags()->where('tag_id', $request['tag_id'])->exists()) {
            $task->tags()->attach($request['tag_id']);
        }

        return back();
    }

    public function detach_tag(Project $project, Request $request)
    {
        Task::find($request['task_id'])->tags()->detach($request['tag_id']);

        return back();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate(['name' => 'required|string|max:80', 'color' => 'required|string|size:7']);

        $tag = Tag::create(['name' => $validated['name'], 'color' => $validated['color'] ?? '#3b82f6', 'project_id' => $project['id']]);

        return back()->with(['tag' => $tag]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Project $project, string $tag)
    {
        $validated = $request->validate(['name' => 'required|string|max:80', 'color' => 'required|string|size:7']);

        Tag::find($tag)->update(['name' => $validated['name'], 'color' => $validated['color'] ?? '#3b82f6']);

        return back()->with('sucess', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project, string $tag)
    {
        Tag::find($tag)->delete();

        return back()->with('sucess', 'Tag deleted successfully');
    }
}
