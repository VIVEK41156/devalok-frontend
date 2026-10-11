<?php

/*
 * Only the real frontend origins may call the API with credentials.
 * Set FRONTEND_URLS to a comma-separated list, e.g.
 *   FRONTEND_URLS=https://devaloksculptures.in,https://www.devaloksculptures.in
 * A wildcard is never used together with supports_credentials.
 */
$origins = array_values(array_filter(array_map('trim', explode(',', (string) env('FRONTEND_URLS', 'http://localhost:3210')))));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Content-Type', 'X-Requested-With', 'X-XSRF-TOKEN'],
    'exposed_headers' => [],
    'max_age' => 3600,
    'supports_credentials' => true,
];
