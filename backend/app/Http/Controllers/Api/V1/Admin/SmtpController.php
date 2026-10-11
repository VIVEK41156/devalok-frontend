<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Services\SmtpMailer;
use App\Support\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Validation\Rule;

/** Admin-only. The app password is write-only: it is never sent back to the browser. */
class SmtpController extends Controller
{
    public function __construct(private SmtpMailer $smtp) {}

    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->state()]);
    }

    /** Save + verify: sends a real test email; only an accepted message marks SMTP as active. */
    public function update(Request $request): JsonResponse
    {
        $hasStored = (bool) $this->smtp->get('smtp_password');
        $data = $request->validate([
            'username' => ['required', 'email', 'max:190'],
            'password' => [$hasStored ? 'nullable' : 'required', 'string', 'max:200'],
            'host' => ['nullable', 'string', 'max:190', 'regex:/^[A-Za-z0-9.-]+$/'],
            'port' => ['nullable', 'integer', Rule::in([25, 465, 587, 2525])],
            'encryption' => ['nullable', Rule::in(['tls', 'ssl'])],
            'from_name' => ['nullable', 'string', 'max:120'],
            'recipient' => ['nullable', 'string', 'max:500'],
        ]);
        $recipients = array_filter(array_map('trim', explode(',', (string) ($data['recipient'] ?? ''))));
        foreach ($recipients as $r) {
            if (! filter_var($r, FILTER_VALIDATE_EMAIL)) {
                return response()->json(['message' => 'Please fix the highlighted fields.', 'errors' => ['recipient' => ["“{$r}” is not a valid email address."]]], 422);
            }
        }

        // Gmail shows app passwords in groups of four; spaces are not part of the password.
        $password = isset($data['password']) && $data['password'] !== '' ? str_replace(' ', '', $data['password']) : null;
        $config = [
            'host' => $data['host'] ?? 'smtp.gmail.com',
            'port' => (int) ($data['port'] ?? 587),
            'encryption' => $data['encryption'] ?? 'tls',
            'username' => $data['username'],
            'from_name' => $data['from_name'] ?? 'Devalok Sculptures',
            'recipient' => $recipients ? implode(', ', $recipients) : $data['username'],
            'password' => $password ?? Crypt::decryptString((string) $this->smtp->get('smtp_password')),
        ];

        try {
            $this->smtp->mailer($config)->raw(
                "SMTP is configured correctly for the Devalok Sculptures website.\n\nNew contact-form enquiries will now be emailed to: {$config['recipient']}",
                fn ($m) => $m->from($config['username'], $config['from_name'])
                    ->to(array_map('trim', explode(',', $config['recipient'])))
                    ->subject('Devalok CMS: SMTP test email'),
            );
        } catch (\Throwable $e) {
            $this->smtp->put('smtp_last_error', mb_substr($this->friendly($e->getMessage()), 0, 250));
            $this->smtp->put('smtp_tested_at', now()->toIso8601String());
            Activity::record('smtp.test_failed', null, 'SMTP test failed');

            return response()->json([
                'message' => 'Could not send the test email: '.$this->friendly($e->getMessage()),
                'errors' => ['password' => [$this->friendly($e->getMessage())]],
                'data' => $this->state(),
            ], 422);
        }

        foreach (['host', 'port', 'encryption', 'username', 'from_name', 'recipient'] as $k) {
            $this->smtp->put("smtp_{$k}", (string) $config[$k]);
        }
        if ($password) {
            $this->smtp->put('smtp_password', Crypt::encryptString($password));
        }
        $this->smtp->put('smtp_status', 'active');
        $this->smtp->put('smtp_last_error', null);
        $this->smtp->put('smtp_tested_at', now()->toIso8601String());
        Activity::record('smtp.configured', null, "SMTP configured for {$config['username']}");

        return response()->json(['message' => "Configured. A test email was sent to {$config['recipient']}.", 'data' => $this->state()]);
    }

    public function destroy(): JsonResponse
    {
        foreach (SmtpMailer::KEYS as $k) {
            $this->smtp->put($k, null);
        }
        Activity::record('smtp.disabled', null, 'SMTP disabled and credentials removed');

        return response()->json(['message' => 'SMTP disabled and credentials removed.', 'data' => $this->state()]);
    }

    private function state(): array
    {
        $c = $this->smtp->config();

        return [
            'active' => $this->smtp->isConfigured(),
            'host' => $c['host'],
            'port' => $c['port'],
            'encryption' => $c['encryption'],
            'username' => $c['username'],
            'from_name' => $c['from_name'],
            'recipient' => $this->smtp->get('smtp_recipient') ?: $c['username'],
            'has_password' => (bool) $this->smtp->get('smtp_password'),
            'last_error' => $this->smtp->get('smtp_last_error'),
            'tested_at' => $this->smtp->get('smtp_tested_at'),
        ];
    }

    private function friendly(string $msg): string
    {
        if (str_contains($msg, '535') || stripos($msg, 'Username and Password not accepted') !== false || stripos($msg, 'authentication') !== false) {
            return 'The email address or app password was not accepted. For Gmail, turn on 2-Step Verification and create an App Password (16 characters).';
        }
        if (stripos($msg, 'Connection could not be established') !== false || stripos($msg, 'timed out') !== false) {
            return 'Could not connect to the mail server. Check the host and port, or whether the server allows outgoing SMTP.';
        }

        return mb_substr(strip_tags($msg), 0, 200);
    }
}
