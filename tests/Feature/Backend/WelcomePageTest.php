<?php

use Inertia\Testing\AssertableInertia as Assert;

it('renders the public welcome page', function () {
    $this->get(route('welcome'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('welcome'));
});
