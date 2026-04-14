<?php

namespace App\Http\Controllers;

use App\Models\ProjectTemplate;
use Inertia\Inertia;
use Inertia\Response;

class TemplatePreviewController extends Controller
{
    /**
     * Render a template as a Traceboard preview.
     *
     * Example: GET /templates/{template}/traceboard.
     */
    public function traceboard(ProjectTemplate $template): Response
    {
        return $this->renderPreview('template-visualizing/traceboard', $template);
    }

    /**
     * Render a template as a Kanban preview.
     *
     * Example: GET /templates/{template}/kanban.
     */
    public function kanban(ProjectTemplate $template): Response
    {
        return $this->renderPreview('template-visualizing/kanban', $template);
    }

    /**
     * Render a template as a pins preview.
     *
     * Example: GET /templates/{template}/pins.
     */
    public function pins(ProjectTemplate $template): Response
    {
        return $this->renderPreview('template-visualizing/pins', $template);
    }

    private function renderPreview(string $page, ProjectTemplate $template): Response
    {
        return Inertia::render($page, [
            'template' => $template,
        ]);
    }
}
