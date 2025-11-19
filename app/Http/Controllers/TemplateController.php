<?php

namespace App\Http\Controllers;

use App\Models\ProjectTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TemplateController extends Controller
{
    
    public function show(ProjectTemplate $template){
        
        return Inertia::render('template-visualizing/traceboard', ['template'=> $template]);
    }
}
