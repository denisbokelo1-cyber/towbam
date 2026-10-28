# TOWBAM — Backend Laravel, base de données et back-office

```
towbam-backend/
├── towbam-api/          fichiers à copier dans un projet Laravel 11
│   ├── routes/api.php
│   ├── app/Models/ · app/Http/Controllers/ · app/Http/Middleware/Role.php
│   └── database/migrations/ · database/seeders/
├── database/schema.sql  schéma PostgreSQL (référence)
└── admin/index.html     interface d'administration (appelle l'API)
```

## 1. Installer
Prérequis : PHP 8.3, Composer, PostgreSQL (ou MySQL).

```bash
composer create-project laravel/laravel towbam-api-app
cd towbam-api-app
php artisan install:api          # installe Sanctum + routes/api.php
```
Copiez ensuite **le contenu** du dossier `towbam-api/` de ce zip dans `towbam-api-app/`
(acceptez de remplacer `routes/api.php`, `app/Models/User.php`, `database/seeders/DatabaseSeeder.php`).

## 2. Configurer `.env`
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=towbam
DB_USERNAME=postgres
DB_PASSWORD=votre_mot_de_passe
PAYMENT_MODE=fake
PAYMENT_WEBHOOK_SECRET=une-longue-valeur-secrete
SEED_PASSWORD=UnMotDePasseSolide!
```
Créez la base : `createdb towbam` (ou via pgAdmin).

## 3. Créer les tables et lancer
```bash
php artisan migrate --seed
php artisan storage:link
php artisan serve                # API sur http://127.0.0.1:8000/api
```
Comptes créés par le seeder : `admin@towbam.test` et `modo@towbam.test`
(mot de passe = `SEED_PASSWORD`). Changez-les avant toute mise en ligne.

## 4. Ouvrir le back-office
Ouvrez `admin/index.html` avec Live Server (VS Code), saisissez l'URL de l'API et connectez-vous avec le compte admin.

## 5. Tester l'API (exemples)
```bash
curl -X POST http://127.0.0.1:8000/api/login -H "Accept: application/json" \
  -H "Content-Type: application/json" -d '{"email":"admin@towbam.test","password":"..."}'
curl http://127.0.0.1:8000/api/books
```

## Ce qui reste à faire (marqué TODO dans le code)
- Vérification d'email à l'inscription (exigence F-01).
- Vrais paiements : Stripe (carte) et un agrégateur mobile money. `PAYMENT_MODE=fake` valide tout sans payer : **ne jamais l'utiliser en production**.
- Filigrane au nom de l'acheteur, reçu par email, notifications push, Meilisearch, Google OAuth, interface multilingue.
- Brancher le site (prototype `index.html` ou Angular) sur cette API.
- En production : HTTPS, CORS limité à votre domaine (`php artisan config:publish cors`), sauvegardes, file d'attente Redis.

⚠️ Ce code n'a pas pu être exécuté ici (pas de PHP dans mon environnement) : lancez les migrations et testez chaque route, puis dites-moi les erreurs éventuelles.
