<?php

namespace App\Http\Controllers;

use App\Models\DatabaseNotification;
use App\Services\NotificationFeed;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    /**
     * Return the authenticated user's recent notification feed.
     *
     * Example: GET /notifications.
     */
    public function index(Request $request, NotificationFeed $feed): JsonResponse
    {
        return response()->json($feed->recentFor($request->user()));
    }

    /**
     * Mark one notification as read for the authenticated user.
     *
     * Example: PATCH /notifications/{notification}/read.
     */
    public function markRead(Request $request, string $notification): JsonResponse
    {
        $storedNotification = $this->userNotification($request, $notification);
        $storedNotification->markAsRead();

        return response()->json(['read_at' => $storedNotification->fresh()->read_at?->toISOString()]);
    }

    /**
     * Mark every unread notification as read for the authenticated user.
     *
     * Example: PATCH /notifications/read-all.
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['unread_count' => 0]);
    }

    /**
     * Soft-delete one notification from the authenticated user's feed.
     *
     * Example: DELETE /notifications/{notification}.
     */
    public function dismiss(Request $request, string $notification): JsonResponse
    {
        $storedNotification = $this->userNotification($request, $notification);
        $storedNotification->delete();

        return response()->json(['dismissed' => true]);
    }

    private function userNotification(Request $request, string $notification): DatabaseNotification
    {
        return $request->user()->notifications()->whereKey($notification)->firstOrFail();
    }
}
