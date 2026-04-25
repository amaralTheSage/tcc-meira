<?php

namespace App\Services\Projects;

use App\Models\Project;
use App\Models\ProjectTemplate;
use App\Models\User;

class ProjectTemplateApplier
{
    public function __construct(
        private readonly ProjectPayloadCloner $cloner,
        private readonly ProjectTemplatePayloadValidator $payloadValidator,
    ) {}

    /**
     * Clone a project template into a new project owned by the user.
     *
     * Example: $project = $applier->apply($template, $user);
     */
    public function apply(ProjectTemplate $template, User $user): Project
    {
        $payload = $template->data;
        $this->payloadValidator->validate($payload);

        return $this->cloner->clone($payload, $user, $this->copyTitle($template));
    }

    private function copyTitle(ProjectTemplate $template): string
    {
        return (strstr($template->name, ' ') ?: $template->name).' Copy';
    }
}
