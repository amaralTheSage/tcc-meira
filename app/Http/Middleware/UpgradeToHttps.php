<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UpgradeToHttps
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        return $response->withHeaders([
            'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy' => 'upgrade-insecure-requests',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
