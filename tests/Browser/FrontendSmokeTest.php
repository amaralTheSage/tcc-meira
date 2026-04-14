<?php

use Tests\Support\BackendFixtures as Backend;

it('renders the public welcome page without browser smoke', function () {
    visit('/')
        ->assertNoSmoke()
        ->assertSee('MEIRA')
        ->assertSee('Continue pelo Navegador');
});

it('renders the authenticated home page without browser smoke', function () {
    [$user] = Backend::projectWithMember(null, ['title' => 'Browser Smoke Project']);

    $this->actingAs($user);

    visit('/home')
        ->assertNoSmoke()
        ->assertSee('Your Projects')
        ->assertSee('Browser Smoke Project');
});
