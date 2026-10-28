<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class Role
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $u = $request->user();
        if (!$u || $u->suspended || !in_array($u->role, $roles, true)) {
            abort(403, 'Accès refusé');
        }
        return $next($request);
    }
}
