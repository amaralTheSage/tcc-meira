<?php

use App\Models\Note;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Database\Seeders\TraceboardRealtimePlaywrightSeeder;
use Illuminate\Support\Facades\DB;

it('seeds deterministic Traceboard realtime browser data', function () {
    $this->seed(TraceboardRealtimePlaywrightSeeder::class);

    $project = Project::findOrFail(TraceboardRealtimePlaywrightSeeder::PROJECT_ID);
    $memberEmails = $project->members()->pluck('email')->all();

    expect($project->title)->toBe(TraceboardRealtimePlaywrightSeeder::PROJECT_TITLE);
    expect($memberEmails)->toContain(
        TraceboardRealtimePlaywrightSeeder::OWNER_EMAIL,
        TraceboardRealtimePlaywrightSeeder::ALICE_EMAIL,
        TraceboardRealtimePlaywrightSeeder::BOB_EMAIL,
    );
    expect(Task::where('id', 'like', 'traceboard-playwright-%')->count())->toBe(6);
    expect(Note::where('id', 'like', 'traceboard-playwright-%')->count())->toBe(2);
    $this->assertDatabaseHas('task_connections', [
        'source_id' => 'traceboard-playwright-disconnect-source',
        'target_id' => 'traceboard-playwright-disconnect-target',
    ]);
});

it('can rerun the Traceboard realtime seeder without duplicate playground rows', function () {
    $this->seed(TraceboardRealtimePlaywrightSeeder::class);
    $this->seed(TraceboardRealtimePlaywrightSeeder::class);

    expect(Project::whereKey(TraceboardRealtimePlaywrightSeeder::PROJECT_ID)->count())->toBe(1);
    expect(User::whereIn('email', [
        TraceboardRealtimePlaywrightSeeder::OWNER_EMAIL,
        TraceboardRealtimePlaywrightSeeder::ALICE_EMAIL,
        TraceboardRealtimePlaywrightSeeder::BOB_EMAIL,
    ])->count())->toBe(3);
    expect(Task::where('id', 'like', 'traceboard-playwright-%')->count())->toBe(6);
    expect(Note::where('id', 'like', 'traceboard-playwright-%')->count())->toBe(2);
    expect(DB::table('task_connections')->where('source_id', 'like', 'traceboard-playwright-%')->count())->toBe(1);
});

it('keeps the main connection pair unconnected for Playwright connect tests', function () {
    $this->seed(TraceboardRealtimePlaywrightSeeder::class);

    $this->assertDatabaseMissing('task_connections', [
        'source_id' => 'traceboard-playwright-connect-source',
        'target_id' => 'traceboard-playwright-connect-target',
    ]);
});
