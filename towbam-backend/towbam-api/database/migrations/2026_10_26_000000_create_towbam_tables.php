<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 20)->default('reader')->index(); // reader | author | moderator | admin
            $t->string('country', 80)->nullable();
            $t->text('bio')->nullable();
            $t->string('link')->nullable();
            $t->boolean('suspended')->default(false);
            $t->string('payout_method', 40)->nullable();
            $t->string('payout_account', 120)->nullable();
        });

        Schema::create('genres', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
        });

        Schema::create('books', function (Blueprint $t) {
            $t->id();
            $t->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('genre_id')->nullable()->constrained('genres')->nullOnDelete();
            $t->string('title', 200);
            $t->string('language', 20);
            $t->text('summary');
            $t->longText('excerpt')->nullable();
            $t->decimal('price', 8, 2);
            $t->unsignedTinyInteger('excerpt_pct')->default(10);
            $t->string('status', 20)->default('draft')->index(); // draft | pending | approved | refused | needs_changes
            $t->text('rejection_reason')->nullable();
            $t->boolean('featured')->default(false);
            $t->string('cover_path')->nullable();
            $t->string('file_path')->nullable();
            $t->timestamp('published_at')->nullable();
            $t->timestamps();
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('provider', 30);
            $t->string('method', 20);
            $t->decimal('amount', 10, 2);
            $t->string('currency', 3)->default('USD');
            $t->string('status', 20)->default('pending'); // pending | paid | failed
            $t->string('reference')->unique();
            $t->json('payload')->nullable();
            $t->timestamps();
        });

        Schema::create('purchases', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('book_id')->constrained()->cascadeOnDelete();
            $t->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $t->decimal('price', 8, 2);
            $t->decimal('author_amount', 8, 2);
            $t->decimal('platform_amount', 8, 2);
            $t->timestamps();
            $t->unique(['user_id', 'book_id']);
        });

        Schema::create('library_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('book_id')->constrained()->cascadeOnDelete();
            $t->timestamp('created_at')->nullable();
            $t->unique(['user_id', 'book_id']);
        });

        Schema::create('follows', function (Blueprint $t) {
            $t->id();
            $t->foreignId('follower_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('author_id')->constrained('users')->cascadeOnDelete();
            $t->timestamp('created_at')->nullable();
            $t->unique(['follower_id', 'author_id']);
        });

        Schema::create('reviews', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('book_id')->constrained()->cascadeOnDelete();
            $t->unsignedTinyInteger('rating');
            $t->text('body')->nullable();
            $t->timestamps();
            $t->unique(['user_id', 'book_id']);
        });

        Schema::create('author_balances', function (Blueprint $t) {
            $t->foreignId('user_id')->primary()->constrained()->cascadeOnDelete();
            $t->decimal('balance', 10, 2)->default(0);
            $t->decimal('total_earned', 10, 2)->default(0);
        });

        Schema::create('payout_requests', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->decimal('amount', 10, 2);
            $t->string('method', 40);
            $t->string('account', 120);
            $t->string('status', 20)->default('pending'); // pending | paid
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });

        Schema::create('moderation_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('book_id')->constrained()->cascadeOnDelete();
            $t->foreignId('moderator_id')->constrained('users')->cascadeOnDelete();
            $t->string('action', 20);
            $t->text('reason')->nullable();
            $t->timestamp('created_at')->nullable();
        });

        Schema::create('notifications', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('type', 30);
            $t->string('message');
            $t->timestamp('read_at')->nullable();
            $t->timestamp('created_at')->nullable();
        });

        Schema::create('reports', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('book_id')->nullable()->constrained()->nullOnDelete();
            $t->string('target');
            $t->text('message');
            $t->boolean('resolved')->default(false);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['reports', 'notifications', 'moderation_logs', 'payout_requests', 'author_balances', 'reviews', 'follows',
                  'library_items', 'purchases', 'payments', 'books', 'genres'] as $t) {
            Schema::dropIfExists($t);
        }
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn(['role', 'country', 'bio', 'link', 'suspended', 'payout_method', 'payout_account']));
    }
};
