<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    private const AFRICA = ['Algérie', 'Bénin', 'Cameroun', 'Congo', 'Côte d’Ivoire', 'Éthiopie', 'Gabon', 'Ghana', 'Kenya', 'Madagascar', 'Mali', 'Maroc', 'Nigeria', 'RDC', 'Rwanda', 'Sénégal', 'Afrique du Sud', 'Tunisie'];

    private function normalizeRole(?string $role): string
    {
        return match (strtolower(trim((string) ($role ?? '')))) {
            'lecteur', 'reader' => 'reader',
            'auteur', 'author' => 'author',
            'moderator', 'mod' => 'moderator',
            'admin' => 'admin',
            default => 'reader',
        };
    }

    public function register(Request $r)
    {
        $d = $r->validate([
            'name' => 'required|string|max:120', 'email' => 'required|email',
            'password' => 'required|string|min:8', 'role' => 'required|string|in:reader,author,lecteur,auteur,moderator,mod,admin',
            'country' => 'required|string|max:80', 'accept_terms' => 'accepted',
        ]);

        $email = mb_strtolower(trim($d['email']));
        if (User::whereRaw('LOWER(email) = ?', [$email])->exists()) {
            return response()->json(['message' => 'Cet email est déjà utilisé.'], 422);
        }

        $role = $this->normalizeRole($d['role']);
        if ($role === 'author' && !in_array($d['country'], self::AFRICA, true)) {
            return response()->json(['message' => 'Le statut d’auteur est ouvert aux auteurs africains.'], 422);
        }

        $u = new User([
            'name' => trim($d['name']),
            'email' => $email,
            'password' => $d['password'],
            'country' => trim($d['country']),
        ]);
        $u->role = $role;
        $u->save();
        // TODO : email de vérification (MustVerifyEmail) — exigence F-01
        return response()->json(['user' => $u, 'token' => $u->createToken('web')->plainTextToken], 201);
    }

    public function login(Request $r)
    {
        $d = $r->validate(['email' => 'required|email', 'password' => 'required']);
        $u = User::where('email', $d['email'])->first();
        if (!$u || !Hash::check($d['password'], $u->password)) {
            return response()->json(['message' => 'Identifiants invalides'], 422);
        }
        if ($u->suspended) {
            return response()->json(['message' => 'Compte suspendu'], 403);
        }
        return ['user' => $u, 'token' => $u->createToken('web')->plainTextToken];
    }

    public function forgot(Request $r)
    {
        Password::sendResetLink($r->validate(['email' => 'required|email']));
        return ['message' => 'Si ce compte existe, un lien a été envoyé.'];
    }

    public function me(Request $r) { return $r->user(); }

    public function update(Request $r)
    {
        $r->user()->update($r->validate([
            'name' => 'sometimes|string|max:120', 'country' => 'sometimes|string|max:80',
            'bio' => 'nullable|string|max:2000', 'link' => 'nullable|url',
            'payout_method' => 'nullable|string|max:40', 'payout_account' => 'nullable|string|max:120',
        ]));
        return $r->user()->fresh();
    }

    public function logout(Request $r)
    {
        $r->user()->currentAccessToken()->delete();
        return ['message' => 'Déconnecté'];
    }
}
