<?php

namespace App\Enums;

enum NotificationType: string
{
    case PROJECT_INVITE = 'project_invite';
    case TASK_ASSIGNED = 'task_assigned';
    case SUBTASK_ASSIGNED = 'subtask_assigned';
    case CHAT_MENTION = 'chat_mention';
}
