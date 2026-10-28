<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CheckoutController extends Controller
{
    public function checkout(Request $r)
    {
        $d = $r->validate(['book_ids' => 'required|array|min:1', 'book_ids.*' => 'integer', 'method' => 'required|in:card,mpesa,orange,airtel,mtn']);
        $owned = DB::table('library_items')->where('user_id', $r->user()->id)->pluck('book_id')->all();
        $books = Book::where('status', 'approved')->whereIn('id', $d['book_ids'])->whereNotIn('id', $owned)->get();
        if ($books->isEmpty()) {
            return response()->json(['message' => 'Rien à acheter'], 422);
        }
        $p = Payment::create(['user_id' => $r->user()->id, 'provider' => $d['method'] === 'card' ? 'stripe' : 'aggregator',
            'method' => $d['method'], 'amount' => $books->sum('price'), 'reference' => (string) Str::uuid(),
            'payload' => ['book_ids' => $books->pluck('id')->all()]]);
        if (env('PAYMENT_MODE', 'fake') === 'fake') { // développement uniquement
            $this->fulfill($p);
            return ['status' => 'paid', 'reference' => $p->reference];
        }
        // TODO : session Stripe / ordre Flutterwave, CinetPay ou PawaPay, puis renvoyer payment_url
        return ['status' => 'pending', 'reference' => $p->reference, 'payment_url' => null];
    }

    public function webhook(Request $r)
    {
        abort_unless($r->filled('reference'), 400, 'Référence manquante');
        abort_unless(hash_equals((string) env('PAYMENT_WEBHOOK_SECRET', 'change-me'), (string) $r->header('X-Webhook-Secret')), 401);
        $p = Payment::where('reference', $r->input('reference'))->firstOrFail();
        $r->input('status') === 'success' ? $this->fulfill($p) : $p->update(['status' => 'failed']);
        return ['ok' => true];
    }

    private function fulfill(Payment $p): void
    {
        DB::transaction(function () use ($p) {
            $p = Payment::lockForUpdate()->find($p->id);
            if ($p->status === 'paid') return; // idempotent
            foreach (Book::whereIn('id', $p->payload['book_ids'])->get() as $b) {
                $authorShare = Book::authorShare();
                $author = round($b->price * $authorShare, 2);
                DB::table('purchases')->insertOrIgnore(['user_id' => $p->user_id, 'book_id' => $b->id, 'payment_id' => $p->id,
                    'price' => $b->price, 'author_amount' => $author, 'platform_amount' => $b->price - $author,
                    'created_at' => now(), 'updated_at' => now()]);
                DB::table('library_items')->insertOrIgnore(['user_id' => $p->user_id, 'book_id' => $b->id, 'created_at' => now()]);
                $row = DB::table('author_balances')->where('user_id', $b->author_id)->lockForUpdate()->first();
                if ($row) {
                    DB::table('author_balances')->where('user_id', $b->author_id)
                        ->update(['balance' => $row->balance + $author, 'total_earned' => $row->total_earned + $author]);
                } else {
                    DB::table('author_balances')->insert(['user_id' => $b->author_id, 'balance' => $author, 'total_earned' => $author]);
                }
            }
            $p->update(['status' => 'paid']);
            // TODO : reçu par email (Mailable en file d'attente)
        });
    }
}
