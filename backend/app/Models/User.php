<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    // HasApiTokens is required by Sanctum's guard; the CMS itself uses cookie
    // sessions and exposes no endpoint that issues personal access tokens.
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_ADMIN = 'admin';

    public const ROLE_EDITOR = 'editor';

    public const ROLES = [self::ROLE_ADMIN, self::ROLE_EDITOR];

    /**
     * role and is_active are only ever set by the admin-only UserController
     * or the devalok:create-admin command, both of which validate them.
     *
     * @var list<string>
     */
    protected $fillable = ['name', 'email', 'password', 'role', 'is_active', 'last_login_at'];

    /** @var list<string> */
    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }
}
