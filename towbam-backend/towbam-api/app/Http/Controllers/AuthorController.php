<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuthorController extends Controller
{
    public function show(User $user)
    {
        abort_unless(in_array($user->role, ['author', 'admin'], true), 404);
        return ['author' => $user->only(['id', 'name', 'country', 'bio', 'link']),
            'followers' => DB::table('follows')->where('author_id', $user->id)->count(),
            'books' => Book::where('author_id', $user->id)->where('status', 'approved')->get()];
    }

    public function follow(Request $r, User $user)
    {
        DB::table('follows')->insertOrIgnore(['follower_id' => $r->user()->id, 'author_id' => $user->id, 'created_at' => now()]);
        return ['following' => true];
    }

    public function unfollow(Request $r, User $user)
    {
        DB::table('follows')->where(['follower_id' => $r->user()->id, 'author_id' => $user->id])->delete();
        return ['following' => false];
    }

    public function myBooks(Request $r) { return Book::where('author_id', $r->user()->id)->latest()->get(); }

    private function rules(bool $new): array
    {
        $p = $new ? 'required' : 'sometimes';
        return ['title' => "$p|string|max:200", 'genre_id' => "$p|exists:genres,id", 'language' => "$p|in:Français,Anglais",
            'summary' => "$p|string|max:3000", 'price' => "$p|numeric|min:1|max:100",
            'excerpt_pct' => 'sometimes|integer|min:5|max:30', 'excerpt' => 'nullable|string',
            'file' => "$p|file|mimes:pdf,epub|max:20480", 'cover' => 'sometimes|image|max:2048'];
    }

    public function store(Request $r)
    {
        $d = $r->validate($this->rules(true) + ['accept_charter' => 'accepted']);
        if (Book::whereRaw('lower(title) = ?', [mb_strtolower($d['title'])])->exists()) {
            return response()->json(['message' => 'Doublon détecté : ce titre existe déjà.'], 422);
        }
        $book = new Book(collect($d)->except(['file', 'cover', 'accept_charter'])->all());
        $book->author_id = $r->user()->id;
        $book->status = $r->boolean('submit') ? 'pending' : 'draft';
        $book->file_path = $r->file('file')->store('books'); // disque privé
        if ($r->hasFile('cover')) $book->cover_path = $r->file('cover')->store('covers', 'public');
        $book->save();
        return response()->json($book, 201);
    }

    private function editable(Request $r, Book $book): void
    {
        abort_unless($book->author_id === $r->user()->id && in_array($book->status, ['draft', 'needs_changes'], true), 403);
    }

    public function update(Request $r, Book $book)
    {
        $this->editable($r, $book);
        $d = $r->validate($this->rules(false));
        $book->fill(collect($d)->except(['file', 'cover'])->all());
        if ($r->hasFile('file')) $book->file_path = $r->file('file')->store('books');
        if ($r->hasFile('cover')) $book->cover_path = $r->file('cover')->store('covers', 'public');
        $book->save();
        return $book;
    }

    public function submit(Request $r, Book $book)
    {
        $this->editable($r, $book);
        $book->update(['status' => 'pending']);
        return $book;
    }

    public function earnings(Request $r)
    {
        $uid = $r->user()->id;
        $bal = DB::table('author_balances')->where('user_id', $uid)->first();
        $sales = DB::table('purchases')->join('books', 'books.id', '=', 'purchases.book_id')->where('books.author_id', $uid)
            ->select('books.title', 'purchases.price', 'purchases.author_amount', 'purchases.created_at')->latest('purchases.created_at')->get();
        return ['balance' => $bal->balance ?? 0, 'total_earned' => $bal->total_earned ?? 0, 'sales_count' => $sales->count(), 'sales' => $sales];
    }

    public function payout(Request $r)
    {
        $d = $r->validate(['amount' => 'required|numeric|min:10']); // seuil minimum : 10 $
        $u = $r->user();
        if (!$u->payout_method || !$u->payout_account) {
            return response()->json(['message' => 'Renseignez votre moyen de retrait dans votre profil.'], 422);
        }
        return DB::transaction(function () use ($d, $u) {
            $bal = DB::table('author_balances')->where('user_id', $u->id)->lockForUpdate()->first();
            abort_if(!$bal || $bal->balance < $d['amount'], 422, 'Solde insuffisant');
            DB::table('author_balances')->where('user_id', $u->id)->decrement('balance', $d['amount']);
            DB::table('payout_requests')->insert(['user_id' => $u->id, 'amount' => $d['amount'], 'method' => $u->payout_method,
                'account' => $u->payout_account, 'status' => 'pending', 'created_at' => now(), 'updated_at' => now()]);
            return response()->json(['message' => 'Demande de retrait envoyée'], 201);
        });
    }
}
