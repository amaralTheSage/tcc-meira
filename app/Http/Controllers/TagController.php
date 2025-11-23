<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Tag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Project $project)
    {
        $tags = $project->tags();
        return back()->with('tags', $tags);
    }


    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project)
    {
        $validated = $request->validate(['name' => 'required|string|max:80']);

        Tag::create(['name' => $validated, 'project_id' => $project['id']]);

        return back()->with('sucess', 'Tag created successfully');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Tag $tag)
    {
        $validated = $request->validate(['name' => 'required|string|max:80']);

        $tag->update(['name' => $validated['name']]);

        return back()->with('sucess', 'Tag updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        Tag::where('id', '==', $id)->delete();

        return back()->with('sucess', 'Tag deleted successfully');
    }
}
