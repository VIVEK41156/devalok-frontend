<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ContactEnquiry;
use App\Models\Sculpture;
use App\Services\SmtpMailer;
use Illuminate\Support\Facades\Log;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactEnquiryController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'phone' => ['nullable', 'string', 'max:40', 'regex:/^[0-9+()\-\s]{6,40}$/'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'min:10', 'max:5000'],
            'sculpture' => ['nullable', 'string', 'max:180'],
            // Honeypot: real visitors never see or fill this field.
            'website' => ['nullable', 'string', 'max:0'],
        ], [
            'website.max' => 'Your enquiry could not be accepted.',
        ]);

        $sculptureId = isset($data['sculpture'])
            ? Sculpture::query()->published()->where('slug', $data['sculpture'])->value('id')
            : null;

        $enquiry = ContactEnquiry::create([
            'name' => strip_tags($data['name']),
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'subject' => strip_tags($data['subject']),
            'message' => strip_tags($data['message']),
            'status' => 'new',
            'sculpture_id' => $sculptureId,
            'ip_hash' => Activity::ipHash(),
        ]);

        // Always stored for the admin panel. If SMTP is configured (Admin → SMTP / Email),
        // the details are also emailed to the business after the response is sent.
        $smtp = app(SmtpMailer::class);
        if ($smtp->isConfigured()) {
            app()->terminating(function () use ($smtp, $enquiry) {
                try {
                    $smtp->sendEnquiry($enquiry->load('sculpture'));
                    $enquiry->forceFill(['notified_at' => now(), 'notify_error' => null])->save();
                } catch (\Throwable $e) {
                    Log::warning('Enquiry email failed: '.$e->getMessage());
                    $enquiry->forceFill(['notify_error' => mb_substr($e->getMessage(), 0, 250)])->save();
                }
            });
        }

        return response()->json([
            'message' => 'Thank you. Your enquiry has been received.',
            'data' => ['id' => $enquiry->id],
        ], 201);
    }
}
