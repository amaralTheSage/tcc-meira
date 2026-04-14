<?php

namespace App\Enums;

enum ProjectInvitationStatus: string
{
    case PENDING = 'pending';
    case ACCEPTED = 'accepted';
    case DECLINED = 'declined';
}
