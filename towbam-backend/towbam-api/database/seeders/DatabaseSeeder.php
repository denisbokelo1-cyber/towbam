<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Roman', 'Nouvelles', 'Poésie', 'Essai', 'Conte', 'Science-fiction', 'Théâtre', 'Jeunesse'] as $g) {
            DB::table('genres')->insertOrIgnore(['name' => $g]);
        }

        $seedPassword = env('SEED_PASSWORD', 'Admin123!');

        foreach ([['Administrateur TOWBAM', 'admin@towbam.test', 'admin'], ['Modérateur TOWBAM', 'modo@towbam.test', 'moderator']] as [$n, $e, $r]) {
            if (!User::where('email', $e)->exists()) {
                $u = new User(['name' => $n, 'email' => $e, 'password' => $seedPassword]);
                $u->role = $r;
                $u->email_verified_at = now();
                $u->save();
            }
        }
    }
}
