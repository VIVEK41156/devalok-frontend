<?php

namespace App\Services;

use App\Models\ContactEnquiry;
use App\Models\SiteSetting;
use Illuminate\Contracts\Mail\Mailer;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Mail;

/**
 * SMTP configured from the admin panel (Admin → SMTP / Email).
 * Settings live in site_settings with is_public = false; the app password is
 * stored encrypted with APP_KEY and is never returned by any endpoint.
 */
class SmtpMailer
{
    public const KEYS = ['smtp_host', 'smtp_port', 'smtp_encryption', 'smtp_username', 'smtp_password', 'smtp_from_name', 'smtp_recipient', 'smtp_status', 'smtp_last_error', 'smtp_tested_at'];

    public function get(string $key): ?string
    {
        return SiteSetting::query()->where('key', $key)->value('value');
    }

    public function put(string $key, ?string $value): void
    {
        SiteSetting::updateOrCreate(['key' => $key], ['value' => $value, 'type' => 'private', 'group' => 'smtp', 'is_public' => false]);
    }

    public function isConfigured(): bool
    {
        return $this->get('smtp_status') === 'active' && $this->get('smtp_username') && $this->get('smtp_password');
    }

    public function config(): array
    {
        return [
            'host' => $this->get('smtp_host') ?: 'smtp.gmail.com',
            'port' => (int) ($this->get('smtp_port') ?: 587),
            'encryption' => $this->get('smtp_encryption') ?: 'tls',
            'username' => $this->get('smtp_username'),
            'from_name' => $this->get('smtp_from_name') ?: 'Devalok Sculptures',
            'recipient' => $this->get('smtp_recipient') ?: $this->get('smtp_username'),
        ];
    }

    public function mailer(?array $override = null): Mailer
    {
        $c = $override ?? $this->config();
        $password = $override['password'] ?? Crypt::decryptString((string) $this->get('smtp_password'));

        return Mail::build([
            'transport' => 'smtp',
            'host' => $c['host'],
            'port' => $c['port'],
            // 465 uses implicit TLS ("smtps"); 587 upgrades with STARTTLS.
            'scheme' => $c['encryption'] === 'ssl' ? 'smtps' : 'smtp',
            'username' => $c['username'],
            'password' => $password,
            'timeout' => 20,
        ]);
    }

    /** Sends the enquiry details to the business, with Reply-To set to the visitor. */
    public function sendEnquiry(ContactEnquiry $e): void
    {
        $c = $this->config();
        $lines = [
            'New enquiry from the Devalok Sculptures website',
            '',
            "Name: {$e->name}",
            "Email: {$e->email}",
            'Phone: '.($e->phone ?: '—'),
            "Subject: {$e->subject}",
            'Sculpture: '.($e->sculpture?->title ?: '—'),
            'Received: '.$e->created_at?->timezone('Asia/Kolkata')->format('d M Y, h:i A').' IST',
            '',
            'Message:',
            $e->message,
            '',
            '— Reply to this email to answer the visitor directly. All enquiries are also listed in Admin → Contact Enquiries.',
        ];
        $this->mailer()->raw(implode("\n", $lines), function ($m) use ($c, $e) {
            $m->from($c['username'], $c['from_name'])
                ->to(array_map('trim', explode(',', (string) $c['recipient'])))
                ->replyTo($e->email, $e->name)
                ->subject("New enquiry: {$e->subject} — {$e->name}");
        });
    }
}
