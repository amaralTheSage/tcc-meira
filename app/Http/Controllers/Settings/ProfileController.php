<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\WorkOS\Http\Requests\AuthKitAccountDeletionRequest;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['nullable', 'image', 'max:2048'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->update([
            'avatar' => $this->avatarUrl($request),
            'name' => $request->string('name')->toString(),
        ]);

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(AuthKitAccountDeletionRequest $request): RedirectResponse
    {
        return $request->delete(
            using: fn (User $user) => $user->delete()
        );
    }

    private function avatarUrl(Request $request): string
    {
        $user = $request->user();

        if (! $request->hasFile('avatar')) {
            return $user->avatar;
        }

        $path = $this->storeUploadedAvatar($request->file('avatar'));
        $this->deleteStoredAvatar($user->avatar);

        return Storage::url($path);
    }

    private function storeUploadedAvatar(UploadedFile $avatar): string
    {
        return $avatar->store('avatars', 'public');
    }

    private function deleteStoredAvatar(string $avatar): void
    {
        if (! str_starts_with($avatar, '/storage/avatars/')) {
            return;
        }

        Storage::disk('public')->delete(str_replace('/storage/', '', $avatar));
    }
}
