<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{


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

        Tag::where('id', '=', $tag)->update(['name' => $validated['name'], 'color' => $validated['color'] ?? '#3b82f6']);

        return back()->with('sucess', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Tag::where('id', '=', $id)->delete();

        return back()->with('sucess', 'Tag deleted successfully');
    }
}
