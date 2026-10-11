<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

/** Admin-only (enforced by the can:admin route middleware). */
class UserController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(User::query()->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:190', 'unique:users,email'],
            'role' => ['required', Rule::in(User::ROLES)],
            'password' => ['required', 'string', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);
        $user = User::create($data + ['is_active' => true]);
        Activity::record('user.created', $user, "Created {$user->role} account {$user->email}");

        return (new UserResource($user))->response()->setStatusCode(201);
    }

    public function update(Request $request, User $user): UserResource
    {
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'role' => ['sometimes', 'required', Rule::in(User::ROLES)],
            'is_active' => ['sometimes', 'boolean'],
            'password' => ['nullable', 'string', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);

        $losingAdmin = ($data['role'] ?? $user->role) !== User::ROLE_ADMIN || (array_key_exists('is_active', $data) && ! $data['is_active']);
        if ($user->isAdmin() && $user->is_active && $losingAdmin && $this->activeAdminCount() <= 1) {
            throw ValidationException::withMessages(['role' => 'At least one active administrator must remain.']);
        }
        if (empty($data['password'])) {
            unset($data['password']);
        }
        $user->update($data);
        Activity::record('user.updated', $user, "Updated account {$user->email}", ['fields' => array_keys(array_diff_key($data, ['password' => 1]))]);

        return new UserResource($user);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            throw ValidationException::withMessages(['user' => 'You cannot delete your own account.']);
        }
        if ($user->isAdmin() && $user->is_active && $this->activeAdminCount() <= 1) {
            throw ValidationException::withMessages(['user' => 'At least one active administrator must remain.']);
        }
        $email = $user->email;
        $user->delete();
        Activity::record('user.deleted', null, "Deleted account {$email}");

        return response()->json(['message' => 'User deleted.']);
    }

    private function activeAdminCount(): int
    {
        return User::where('role', User::ROLE_ADMIN)->where('is_active', true)->count();
    }
}
