<?php

namespace App\Http\Controllers;

use App\Models\Pin;
use App\Models\Project;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Number;

class PinController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Project $project)
    {
        $pins = Pin::where('project_id', $project->id)->orderBy('position', 'asc')->get();

        return Inertia::render('project/pins', ['project' => $project, 'pins'=>$pins]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Project $project)
    {
        $request->validate(
            [
                'type'=> 'in:text,link|required',
                'text'=>'sometimes|string|max:2800',
                'title'=>'sometimes|string|max:140',
                'url'=>'sometimes|string|max:4000',
                'position'=>'required|integer'
            ]
        );

        if($request->type === 'link'){
            Pin::create(['title'=>$request->title ?? null, 'url'=>$request->url, 'project_id'=>$project->id, 'position'=>$request->position]);
        } else if($request->type === 'text'){
            Pin::create(['text'=>$request->text, 'project_id'=>$project->id, 'position'=>$request->position]);
        }

        return back();
    }

    public function move(Project $project, Pin $pin, Request $request){

        Pin::whereId($pin->id)->update(['position'=> $request->position]);

        return back();
    }


    public function show(Pin $pin)
    {
        //
    }


    public function update(Request $request, Pin $pin)
    {
        //
    }

    
    public function destroy(Project $project, $id)
    {
        Pin::where('id', $id)->delete();

        return back();
    }
}
