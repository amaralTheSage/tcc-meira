<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CollaborationHistoryService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Search users by name or email for people pickers.
     *
     * Example: GET /search-users?search=ana.
     */
    public function searchUsers(Request $request, CollaborationHistoryService $collaborations): JsonResponse
    {
        $users = $collaborations
            ->rankUsersFor($request->user(), $this->searchCandidates($request))
            ->limit(20)
            ->get();

        return response()->json($users);
    }

    private function searchCandidates(Request $request): Builder
    {
        $search = $request->string('search')->lower()->toString();

        return User::query()
            ->where('users.id', '!=', $request->user()->id)
            ->when($search !== '', fn (Builder $query): Builder => $query->where(fn (Builder $userQuery): Builder => $userQuery
                ->whereRaw('LOWER(users.name) LIKE ?', ["%{$search}%"])
                ->orWhereRaw('LOWER(users.email) LIKE ?', ["%{$search}%"])));
    }
}
