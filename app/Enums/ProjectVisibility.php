<?php

namespace App\Enums;

enum ProjectVisibility: string
{
    case PRIVATE = 'private';
    case LINK_ONLY = 'link_only';
    case PUBLIC = 'public';
}
