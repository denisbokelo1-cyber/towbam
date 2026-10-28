<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    // role et suspended ne sont jamais modifiables par l'utilisateur
    protected $fillable = ['name', 'email', 'password', 'country', 'bio', 'link', 'payout_method', 'payout_account'];
    protected $hidden = ['password', 'remember_token', 'payout_account'];

    protected function casts(): array
    {
        return ['email_verified_at' => 'datetime', 'password' => 'hashed', 'suspended' => 'boolean'];
    }

    public function books() { return $this->hasMany(Book::class, 'author_id'); }
}
