<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('guests are redirected to the login page', function () {
    $this->get('/home')->assertRedirect('/login');
});

test('authenticated users can visit the homepage', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/home')->assertOk();
});
