<?php

use App\Http\Controllers\{AdminController, AuthController, AuthorController, CatalogController, CheckoutController, LibraryController};
use App\Http\Middleware\Role;
use Illuminate\Support\Facades\Route;

// Public
Route::post('register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('forgot-password', [AuthController::class, 'forgot'])->middleware('throttle:5,1');
Route::get('books', [CatalogController::class, 'index']);
Route::get('search', [CatalogController::class, 'index']);
Route::get('books/new-talents', [CatalogController::class, 'newTalents']);
Route::get('books/{book}', [CatalogController::class, 'show']);
Route::get('books/{book}/excerpt', [CatalogController::class, 'excerpt']);
Route::get('authors/{user}', [AuthorController::class, 'show']);
Route::get('genres', fn () => \Illuminate\Support\Facades\DB::table('genres')->orderBy('name')->get());
Route::post('webhooks/payments', [CheckoutController::class, 'webhook']);
Route::get('files/{book}/{user}', [LibraryController::class, 'download'])->name('files.download')->middleware('signed');

// Connecté
Route::middleware('auth:sanctum')->group(function () {
    Route::get('me', [AuthController::class, 'me']);
    Route::put('me', [AuthController::class, 'update']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('authors/{user}/follow', [AuthorController::class, 'follow']);
    Route::delete('authors/{user}/follow', [AuthorController::class, 'unfollow']);
    Route::post('cart/checkout', [CheckoutController::class, 'checkout']);
    Route::get('library', [LibraryController::class, 'index']);
    Route::get('library/{book}/read', [LibraryController::class, 'read']);
    Route::post('books/{book}/reviews', [LibraryController::class, 'review']);
    Route::post('reports', [AdminController::class, 'report']);

    // Auteur
    Route::middleware(Role::class . ':author,admin')->prefix('author')->group(function () {
        Route::get('books', [AuthorController::class, 'myBooks']);
        Route::post('books', [AuthorController::class, 'store']);
        Route::put('books/{book}', [AuthorController::class, 'update']);
        Route::post('books/{book}/submit', [AuthorController::class, 'submit']);
        Route::get('earnings', [AuthorController::class, 'earnings']);
        Route::post('payouts', [AuthorController::class, 'payout']);
    });

    // Modérateur + admin
    Route::middleware(Role::class . ':moderator,admin')->prefix('admin')->group(function () {
        Route::get('stats', [AdminController::class, 'stats']);
        Route::get('submissions', [AdminController::class, 'submissions']);
        Route::post('submissions/{book}/approve', [AdminController::class, 'approve']);
        Route::post('submissions/{book}/reject', [AdminController::class, 'reject']);
        Route::get('reports', [AdminController::class, 'reports']);
        Route::post('reports/{id}/resolve', [AdminController::class, 'resolve']);
        Route::get('audit', [AdminController::class, 'audit']);
    });

    // Admin seulement
    Route::middleware(Role::class . ':admin')->prefix('admin')->group(function () {
        Route::get('users', [AdminController::class, 'users']);
        Route::post('users/{user}/suspend', [AdminController::class, 'suspend']);
        Route::post('books/{book}/feature', [AdminController::class, 'feature']);
        Route::get('payouts', [AdminController::class, 'payouts']);
        Route::post('payouts/{id}/pay', [AdminController::class, 'payPayout']);
        Route::get('settings/commission', [AdminController::class, 'commissionSetting']);
        Route::put('settings/commission', [AdminController::class, 'updateCommissionSetting']);
    });
});
