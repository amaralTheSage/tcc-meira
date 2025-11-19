<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProjectTemplate>
 */
class ProjectTemplateFactory extends Factory
{

    public function definition(): array
    {
         $template = [
                "columns" => [
                    [
                        "id" => "col-1",
                        "name" => "Backlog",
                        "position" => 1,
                        "type" => "default"
                    ],
                    [
                        "id" => "col-2",
                        "name" => "In Progress",
                        "position" => 2,
                        "type" => "default"
                    ],
                    [
                        "id" => "col-3",
                        "name" => "Done",
                        "position" => 3,
                        "type" => "default"
                    ]
                ],

                "tasks" => [
                    [
                        "id" => "task-1",
                        "title" => "Design UI",
                        "description" => "Initial mockups",
                        "image" => null,
                        "position" => 1,
                        "x" => 150,
                        "y" => 80,
                        "column_id" => "col-1",
                        "status" => "open",

                        "subtasks" => [
                            [
                                "id" => 1,
                                "title" => "Wireframes",
                                "completed" => false,
                                "position" => 1,
                            ],
                            [
                                "id" => 2,
                                "title" => "Color palette",
                                "completed" => false,
                                "position" => 2,
                            ]
                        ],

                        "assigned_users" => [
                            1, 5, 12
                        ]
                    ],

                    [
                        "id" => "task-2",
                        "title" => "Backend Setup",
                        "description" => "Database + Auth",
                        "image" => null,
                        "position" => 2,
                        "x" => 400,
                        "y" => 140,
                        "column_id" => "col-2",
                        "status" => "in-progress",

                        "subtasks" => [
                            [
                                "id" => 3,
                                "title" => "Migrations",
                                "completed" => true,
                                "position" => 1,
                            ],
                            [
                                "id" => 4,
                                "title" => "Login / Register",
                                "completed" => false,
                                "position" => 2,
                            ]
                        ],

                        "assigned_users" => [
                            2, 7
                        ]
                    ]
                ],

                "task_connections" => [
                    [
                        "id" => 1,
                        "source_id" => "task-1",
                        "target_id" => "task-2"
                    ]
                ],

                "pins" => [
                    [
                        "id" => 1,
                        "title" => "Figma File",
                        "url" => "https://figma.com/project",
                        "text" => "Latest design reference",
                        "position" => 1
                    ],
                    [
                        "id" => 2,
                        "title" => "Docs",
                        "url" => "https://domain.com/docs",
                        "text" => "API documentation",
                        "position" => 2
                    ]
                ],

                "notes" => [
                    [
                        "id" => "note-1",
                        "text" => "Remember to sync with the design team.",
                        "x" => 200,
                        "y" => 120
                    ],
                    [
                        "id" => "note-2",
                        "text" => "Database schema almost ready.",
                        "x" => 450,
                        "y" => 260
                    ]
                ],

                "project_users" => [
                    [
                        "user_id" => 1,
                    ],
                    [
                        "user_id" => 2,
                    ]
                ]];



        return [
            "name" => "Example Project Template",
            "user_id" => 1,
            "project_id" => "019a9ce1-9f57-7113-b6df-86e5243dbac2",
            'data' => $template
        ];
    }
}

