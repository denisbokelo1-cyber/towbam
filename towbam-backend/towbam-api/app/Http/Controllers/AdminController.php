<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function stats()
    {
        return ['users' => User::count(), 'authors' => User::where('role', 'author')->count(),
            'books' => Book::where('status', 'approved')->count(), 'pending' => Book::where('status', 'pending')->count(),
            'sales' => DB::table('purchases')->count(), 'revenue' => (float) (DB::table('purchases')->sum('price') ?? 0),
            'open_reports' => DB::table('reports')->where('resolved', false)->count(),
            'pending_payouts' => DB::table('payout_requests')->where('status', 'pending')->count()];
    }

    public function audit()
    {
        return DB::table('moderation_logs as ml')
            ->join('books as b', 'b.id', '=', 'ml.book_id')
            ->join('users as u', 'u.id', '=', 'ml.moderator_id')
            ->select('ml.*', 'b.title as book_title', 'u.name as moderator_name')
            ->orderByDesc('ml.created_at')
            ->limit(100)
            ->get();
    }

    public function commissionSetting()
    {
        $value = DB::table('settings')->where('key', 'author_commission')->value('value');
        return ['key' => 'author_commission', 'value' => (float) ($value ?? Book::DEFAULT_AUTHOR_SHARE) * 100];
    }

    public function updateCommissionSetting(Request $r)
    {
        $d = $r->validate(['value' => 'required|numeric|min:0|max:100']);
        $value = max(0, min((float) $d['value'], 100)) / 100;

        DB::table('settings')->updateOrInsert(
            ['key' => 'author_commission'],
            ['value' => (string) $value, 'updated_at' => now()]
        );

        return ['key' => 'author_commission', 'value' => $value * 100];
    }

    public function submissions() { return Book::with('author:id,name,country')->where('status', 'pending')->oldest()->get(); }

    private function log(Request $r, Book $b, string $action, ?string $reason = null): void
    {
        DB::table('moderation_logs')->insert(['book_id' => $b->id, 'moderator_id' => $r->user()->id, 'action' => $action, 'reason' => $reason, 'created_at' => now()]);
    }

    public function approve(Request $r, Book $book)
    {
        abort_unless($book->status === 'pending', 422, 'Pas en attente');
        $book->forceFill(['status' => 'approved', 'published_at' => now()])->save();
        $this->log($r, $book, 'approved');
        foreach (DB::table('follows')->where('author_id', $book->author_id)->pluck('follower_id') as $uid) {
            DB::table('notifications')->insert(['user_id' => $uid, 'type' => 'new_book', 'message' => "Nouvelle publication : {$book->title}", 'created_at' => now()]);
        }
        return $book;
    }

    public function reject(Request $r, Book $book)
    {
        $d = $r->validate(['reason' => 'required|string|max:1000', 'action' => 'required|in:refused,needs_changes']);
        abort_unless($book->status === 'pending', 422, 'Pas en attente');
        $book->forceFill(['status' => $d['action'], 'rejection_reason' => $d['reason']])->save();
        $this->log($r, $book, $d['action'], $d['reason']);
        DB::table('notifications')->insert(['user_id' => $book->author_id, 'type' => 'moderation', 'message' => "« {$book->title} » : {$d['reason']}", 'created_at' => now()]);
        return $book;
    }

    public function report(Request $r)
    {
        $d = $r->validate(['target' => 'required|string|max:255', 'message' => 'required|string|max:2000', 'book_id' => 'nullable|exists:books,id']);
        DB::table('reports')->insert(['target' => $d['target'], 'message' => $d['message'], 'book_id' => $d['book_id'] ?? null,
            'user_id' => $r->user()->id, 'created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Signalement transmis'], 201);
    }

    public function reports() { return DB::table('reports')->where('resolved', false)->latest()->get(); }

    public function resolve($id)
    {
        abort_unless(DB::table('reports')->where('id', $id)->exists(), 404, 'Signalement introuvable');
        DB::table('reports')->where('id', $id)->update(['resolved' => true, 'updated_at' => now()]);
        return ['ok' => true];
    }

    public function users() { return User::latest()->paginate(50); }

    public function suspend(Request $r, User $user)
    {
        abort_if($user->id === $r->user()->id, 422, 'Impossible de vous suspendre vous-même');
        $user->forceFill(['suspended' => !$user->suspended])->save();
        if ($user->suspended) $user->tokens()->delete();
        return $user;
    }

    public function feature(Book $book)
    {
        $book->forceFill(['featured' => !$book->featured])->save();
        return $book;
    }

    public function payouts()
    {
        return DB::table('payout_requests')->join('users', 'users.id', '=', 'payout_requests.user_id')
            ->select('payout_requests.*', 'users.name')->latest('payout_requests.created_at')->get();
    }

    public function payPayout($id)
    {
        DB::table('payout_requests')->where(['id' => $id, 'status' => 'pending'])->update(['status' => 'paid', 'paid_at' => now(), 'updated_at' => now()]);
        return ['ok' => true];
    }
}
