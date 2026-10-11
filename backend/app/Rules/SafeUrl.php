<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Accepts site-relative paths ("/gallery", "/products#marble"), in-page anchors,
 * and absolute http(s)/mailto/tel URLs. Rejects javascript:, data:, protocol-relative
 * ("//evil.example") and anything else that could execute or redirect unexpectedly.
 */
class SafeUrl implements ValidationRule
{
    public function __construct(private bool $allowContactSchemes = true) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            return;
        }
        $v = trim($value);
        if (preg_match('/[\x00-\x1F\x7F\s]/', $v)) {
            $fail('The :attribute must not contain spaces or control characters.');

            return;
        }
        if (str_starts_with($v, '#') || (str_starts_with($v, '/') && ! str_starts_with($v, '//'))) {
            return;
        }
        $scheme = strtolower((string) parse_url($v, PHP_URL_SCHEME));
        $allowed = $this->allowContactSchemes ? ['http', 'https', 'mailto', 'tel'] : ['http', 'https'];
        if (! in_array($scheme, $allowed, true)) {
            $fail('The :attribute must be a site path (e.g. /gallery) or an http(s) link.');

            return;
        }
        if (in_array($scheme, ['http', 'https'], true) && ! filter_var($v, FILTER_VALIDATE_URL)) {
            $fail('The :attribute is not a valid URL.');
        }
    }
}
