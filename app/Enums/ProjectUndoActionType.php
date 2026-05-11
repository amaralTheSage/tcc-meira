<?php

namespace App\Enums;

enum ProjectUndoActionType: string
{
    case ATTACH_SUBTASK_USER = 'attach_subtask_user';
    case ATTACH_TASK_TAG = 'attach_task_tag';
    case ATTACH_TASK_USER = 'attach_task_user';
    case CONNECT_TASKS = 'connect_tasks';
    case CREATE_COLUMN = 'create_column';
    case CREATE_NOTE = 'create_note';
    case CREATE_PIN = 'create_pin';
    case CREATE_SUBTASK = 'create_subtask';
    case CREATE_TAG = 'create_tag';
    case CREATE_TASK = 'create_task';
    case DELETE_COLUMN = 'delete_column';
    case DELETE_NOTE = 'delete_note';
    case DELETE_PIN = 'delete_pin';
    case DELETE_SUBTASK = 'delete_subtask';
    case DELETE_TAG = 'delete_tag';
    case DELETE_TASK = 'delete_task';
    case DETACH_SUBTASK_USER = 'detach_subtask_user';
    case DETACH_TASK_TAG = 'detach_task_tag';
    case DETACH_TASK_USER = 'detach_task_user';
    case DISCONNECT_TASKS = 'disconnect_tasks';
    case MOVE_NOTE = 'move_note';
    case MOVE_PIN = 'move_pin';
    case MOVE_TASK = 'move_task';
    case REORDER_COLUMNS = 'reorder_columns';
    case REORDER_PINS = 'reorder_pins';
    case REORDER_TASKS = 'reorder_tasks';
    case UPDATE_COLUMN = 'update_column';
    case UPDATE_NOTE = 'update_note';
    case UPDATE_SUBTASK = 'update_subtask';
    case UPDATE_TAG = 'update_tag';
    case UPDATE_TASK = 'update_task';
}
