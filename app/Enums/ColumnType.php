<?php

namespace App\Enums;

enum ColumnType: string
{
    case STANDARD = 'standard';
    case BACKLOG = 'backlog';
    case TODO = 'to_do';
    case IN_PROGRESS = 'in_progress';
    case DONE = 'done';
}
