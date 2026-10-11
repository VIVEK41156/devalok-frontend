<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactEnquiry extends Model
{
    public const STATUSES = ['new', 'in_progress', 'resolved'];

    protected $fillable = ['name', 'email', 'phone', 'subject', 'message', 'status', 'sculpture_id', 'ip_hash', 'handled_by', 'notified_at', 'notify_error'];

    protected $casts = ['notified_at' => 'datetime'];

    protected $hidden = ['ip_hash'];

    public function sculpture(): BelongsTo
    {
        return $this->belongsTo(Sculpture::class);
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
