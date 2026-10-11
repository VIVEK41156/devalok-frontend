<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ContactEnquiry */
class EnquiryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'subject' => $this->subject,
            'message' => $this->message,
            'status' => $this->status,
            'sculpture' => $this->whenLoaded('sculpture', fn () => $this->sculpture ? ['id' => $this->sculpture->id, 'title' => $this->sculpture->title, 'slug' => $this->sculpture->slug] : null),
            'handled_by' => $this->whenLoaded('handler', fn () => $this->handler?->name),
            'emailed_at' => $this->notified_at?->toIso8601String(),
            'email_error' => $this->notify_error,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
