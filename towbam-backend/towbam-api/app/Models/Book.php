<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    public const DEFAULT_AUTHOR_SHARE = 0.70;

    protected $guarded = ['id', 'author_id', 'status', 'featured', 'published_at'];
    protected $hidden = ['file_path', 'excerpt'];
    protected $casts = ['featured' => 'boolean', 'published_at' => 'datetime'];

    public static function authorShare(): float
    {
        $value = (float) (
            \Illuminate\Support\Facades\DB::table('settings')->where('key', 'author_commission')->value('value')
            ?? self::DEFAULT_AUTHOR_SHARE
        );

        if ($value < 0 || $value > 1) {
            return self::DEFAULT_AUTHOR_SHARE;
        }

        return $value;
    }

    public function author() { return $this->belongsTo(User::class, 'author_id'); }
    public function genre() { return $this->belongsTo(Genre::class); }
    public function reviews() { return $this->hasMany(Review::class); }
}
