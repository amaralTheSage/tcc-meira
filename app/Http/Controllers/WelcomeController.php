<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class WelcomeController extends Controller
{
    /**
     * Render the public landing page.
     *
     * Example: GET /
     */
    public function __invoke(): Response
    {
        return Inertia::render('welcome');
    }
}
