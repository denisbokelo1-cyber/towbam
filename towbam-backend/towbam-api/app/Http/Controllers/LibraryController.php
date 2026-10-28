<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class LibraryController extends Controller
{
    private function owns(int $user, Book $book): bool
    {
        return DB::table('library_items')->where(['user_id' => $user, 'book_id' => $book->id])->exists();
    }

    public function index(Request $r)
    {
        $ids = DB::table('library_items')->where('user_id', $r->user()->id)->pluck('book_id');
        return Book::with('author:id,name')->whereIn('id', $ids)->get();
    }

    // Le livre complet n'est jamais public : URL signée valable 10 minutes
    public function read(Request $r, Book $book)
    {
        abort_unless($this->owns($r->user()->id, $book), 403, 'Livre non acheté');
        // TODO : filigrane au nom de l'acheteur (génération PDF en file d'attente)
        return ['url' => URL::temporarySignedRoute('files.download', now()->addMinutes(10), ['book' => $book->id, 'user' => $r->user()->id])];
    }

    public function download(Book $book, int $user)
    {
        abort_unless($this->owns($user, $book), 403);
        abort_unless($book->file_path && Storage::exists($book->file_path), 404, 'Fichier introuvable');
        return Storage::download($book->file_path);
    }

    public function review(Request $r, Book $book)
    {
        abort_unless($this->owns($r->user()->id, $book), 403, 'Les avis sont ouverts après achat');
        $d = $r->validate(['rating' => 'required|integer|between:1,5', 'body' => 'nullable|string|max:2000']);
        DB::table('reviews')->updateOrInsert(['user_id' => $r->user()->id, 'book_id' => $book->id], $d + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Avis publié'], 201);
    }
}
