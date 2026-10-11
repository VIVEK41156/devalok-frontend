<?php

namespace App\Support;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

/**
 * Audit trail for admin actions. Never pass passwords, tokens or cookies in $properties.
 */
class Activity
{
    public static function record(string $action, ?Model $subject = null, ?string $description = null, array $properties = [], ?int $userId = null): void
    {
        ActivityLog::create([
            'user_id' => $userId ?? Auth::id(),
            'action' => $action,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id' => $subject?->getKey(),
            'description' => $description ? mb_substr($description, 0, 255) : null,
            'properties' => $properties ?: null,
            'ip_hash' => self::ipHash(),
        ]);
    }

    public static function ipHash(): ?string
    {
        $ip = Request::ip();

        return $ip ? hash_hmac('sha256', $ip, (string) config('app.key')) : null;
    }
}
