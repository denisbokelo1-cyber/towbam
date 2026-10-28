<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\Request;

class CatalogController extends Controller
{
    public function index(Request $r)
    {
        $q = Book::with(['author:id,name,country', 'genre:id,name'])->withAvg('reviews', 'rating')->where('status', 'approved');
        if ($s = mb_strtolower(trim((string) $r->q))) {
            $like = "%$s%";
            $q->where(fn ($w) => $w->whereRaw('lower(title) like ?', [$like])
                ->orWhereRaw('lower(summary) like ?', [$like])
                ->orWhereHas('author', fn ($a) => $a->whereRaw('lower(name) like ?', [$like])));
        }
        if ($r->genre_id) $q->where('genre_id', $r->genre_id);
        if ($r->language) $q->where('language', $r->language);
        if ($r->country) $q->whereHas('author', fn ($a) => $a->where('country', $r->country));
        if ($r->max_price) $q->where('price', '<=', (float) $r->max_price);
        match ($r->sort) {
            'price_asc' => $q->orderBy('price'),
            'price_desc' => $q->orderByDesc('price'),
            default => $q->orderByDesc('published_at'),
        };
        return $q->paginate(20);
    }

    public function newTalents()
    {
        $ids = Book::where('status', 'approved')->where('published_at', '>=', now()->subDays(60))->pluck('id')->all();
        if (empty($ids)) {
            return collect();
        }

        shuffle($ids);
        $selected = array_slice($ids, 0, 12);
        $books = Book::with('author:id,name,country')->whereIn('id', $selected)->get();

        return $books->sortBy(fn ($book) => array_search($book->id, $selected, true))->values();
    }

    public function show(Book $book)
    {
        abort_unless($book->status === 'approved', 404);
        return $book->load(['author:id,name,country,bio', 'genre:id,name', 'reviews'])->loadAvg('reviews', 'rating');
    }

    public function excerpt(Book $book)
    {
        abort_unless($book->status === 'approved', 404);
        return ['excerpt' => $book->makeVisible('excerpt')->excerpt, 'percent' => $book->excerpt_pct];
    }
}
