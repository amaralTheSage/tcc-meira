<?php

namespace App\Services\Projects;

use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;

class ProjectTemplateApplier
{
    public function __construct(private readonly ProjectPayloadCloner $cloner) {}

    /**
     * Clone a project template into a new project owned by the user.
     *
     * Example: $project = $applier->apply($template, $user);
     */
    public function apply(ProjectTemplate $template, User $user): Project
    {
        return $this->cloner->clone($template->data, $user, $this->copyTitle($template));
    }

    private function copyTitle(ProjectTemplate $template): string
    {
        return (strstr($template->name, ' ') ?: $template->name).' Copy';
    }
}
