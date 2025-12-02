<?php

namespace App\Http\Controllers;

use App\Enums\ColumnType;
use App\Models\Column;
use App\Models\CommunityPost;
use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;
use Illuminate\Http\File;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Str;

class ProjectController extends Controller
{
    public function index()
    {
        $projects = Auth::user()->projects()->with('members')->get();


        $users = User::whereNot('id', Auth::id())->paginate(10);

        return Inertia::render('home', [
            'projects' => $projects,
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:50'],
            'selectedUsers' => ['nullable', 'array'],
        ]);

        $project = Project::create($validated);

        $project->members()->attach(Auth::user());

        foreach ($request->selectedUsers as $index => $id) {
            $project->members()->attach($id);
        }

        return to_route('traceboard', ['project' => $project]);
    }

    // Project Settings
    public function edit(Project $project)
    {
        return Inertia::render('project/project-settings', ['project' => $project->load('members')]);
    }

    public function update(Project $project, Request $request)
    {
        $validated = $request->validate([
            'edge_type' => ['in:bezier,straight,step,smoothstep,default'],
            'animated_edges' => ['boolean'],
        ]);

        $project->update($validated);

        return back();
    }

    public function publishing_form(Project $project)
    {
        return Inertia::render('project/publish', ['project' => $project->load('members')]);
    }

    public function publish(Project $project, Request $request)
    {

        # to-do: validate better
        $validated = $request->validate([
            'title' => 'required',
            'description' => 'required|min:200',
            'create_template' => 'boolean',
            'images' => 'required|array',
        ]);


        $templateData = [
            'columns'        => $project->columns()->orderBy('position')->get()->toArray(),
            'tasks'          => $project->tasks()->with(['subtasks'])->orderBy('position')->get()->toArray(),
            'pins'           => $project->pins()->orderBy('position')->get()->toArray(),
            'notes'          => $project->notes()->get()->toArray(),
            // 'project_users'  => $project->members()->pluck('id')->map(fn($id) => ['user_id' => $id])->toArray(),
            'task_connections' => DB::table('task_connections')
                ->whereIn('source_id', $project->tasks->pluck('id'))
                ->get()
                ->toArray(),

        ];

        $templateName = strval('Template ' . $validated['title']);

        # cria o template
        if ($request['create_template']) {
            ProjectTemplate::create([
                'user_id' => Auth::id(),
                'name'    => $templateName,
                'project_id' => $project->id,
                'data'    => $templateData
            ]);
        }


        $post = CommunityPost::create($validated);

        $post->members()->attach($project->members);

        // fix
        // foreach ($request->images as $image) {
        //     $path = Storage::disk('public')->putFile('posts', $image);

        //     DB::table('image_post')->insert([
        //         'post_id' => $post->id,
        //         'image_path' => $path
        //     ]);
        // }

        // Uncomment later
        // Project::whereId($project->id)->delete();    

        return Inertia::render('community/profile', ['user' => Auth::user()->load(['projects'])])->with('sucess', 'Project published succesfully!');
    }

    public function apply_template(ProjectTemplate $template)
    {
        $project = Project::create(['title' => strstr($template['name'], " ") . ' Copy']);
        $project->members()->attach(Auth::user());

        # colunas
        foreach ($template->data['columns'] as $col) {
            Column::create([
                'project_id' => $project->id,
                'name'       => $col['name'],
                'type'       => $col['type'],
                'position'   => $col['position'],
            ]);
        }



        # tasks
        foreach ($template->data['tasks'] as $taskData) {
            $newId = (string) Str::uuid7();
            $oldId = $taskData['id'];
            $taskIdMap[$oldId] = $newId;

            if (!isset($taskData['column_id'])) {
                $backlogColumn = Column::where('project_id', $project->id)
                    ->where('type', ColumnType::BACKLOG->value)
                    ->first();

                if ($backlogColumn) {
                    $taskData['column_id'] = $backlogColumn->id;
                }
            }


            $task = $project->tasks()->create([
                'id' => $newId,
                'title' => $taskData['title'],
                'image' => $taskData['image'] ?? null,
                'description' => $taskData['description'] ?? null,
                'x' => $taskData['x'],
                'y' => $taskData['y'],
                'position' => $taskData['position'] ?? 0,
                'column_id' => $taskData['column_id'],
                'project_id' => $project->id
            ]);

            foreach ($taskData['subtasks'] ?? [] as $subtaskData) {
                $task->subtasks()->create([
                    'title' => $subtaskData['title'],
                    'image' => $subtaskData['image'] ?? null,
                    'description' => $subtaskData['description'] ?? null,
                    'position' => $subtaskData['position'] ?? 0,
                ]);
            }
        }


        #  TASK CONNECTIONS 
        foreach ($template->data['task_connections'] as $conn) {
            $source = $taskIdMap[$conn['source_id']] ?? null;
            $target = $taskIdMap[$conn['target_id']] ?? null;

            if ($source && $target) {
                DB::table('task_connections')->insert([
                    'source_id' => $source,
                    'target_id' => $target,
                ]);
            }
        }

        # notas
        foreach ($template->data['notes'] as $note) {
            $project->notes()->create([
                'id' =>  Str::uuid7(),
                'text' => $note['text'],
                'x'    => $note['x'],
                'y'    => $note['y'],
            ]);
        }

        # pins
        foreach ($template->data['pins'] as $pin) {
            $project->pins()->create([
                'title'    => $pin['title'],
                'url'      => $pin['url'] ?? null,
                'text'     => $pin['text'] ?? null,
                'position' => $pin['position'],
            ]);
        }

        return redirect()->route('traceboard', $project);
    }


    public function kanban(Project $project)
    {
        $columns = $project->columns()->with(['tasks.users', 'tasks.tags'])->orderBy('position')->get();

        return Inertia::render('project/kanban', [
            'project' => $project->load('members'),
            'columns' => $columns,
        ]);
    }

    public function destroy(Project $project)
    {
        $project->delete();
        return to_route('home');
    }
}
