<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'action', 'subject_type', 'subject_id', 'description', 'properties', 'ip_hash'];

    protected $casts = ['properties' => 'array'];

    protected $hidden = ['ip_hash'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
