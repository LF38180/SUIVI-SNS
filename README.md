# Suivi du programme — Seyssins Nature & Solidaire

Application web de suivi des 67 engagements du programme municipal SNS 2026-2032.
Outil du **groupe politique SNS**, indépendant des moyens de la mairie (cahier des charges §8.1).

## Stack

- **Next.js 16** (App Router) + TypeScript + React 19
- **PostgreSQL** (Railway) via **Prisma 7** (adapter `@prisma/adapter-pg`)
- Authentification maison : sessions cookie signées (HMAC), mots de passe **bcrypt**
- Tests : **Vitest**

## Prérequis

- Node.js ≥ 20.9
- Une base PostgreSQL (Railway en prod ; en local on utilise le `DATABASE_PUBLIC_URL` de Railway)

## Installation locale

```bash
npm install
cp .env.example .env
# Éditer .env : coller le DATABASE_PUBLIC_URL de Railway, générer SESSION_SECRET (openssl rand -hex 32)
npm run db:deploy   # applique les migrations (création des tables)
npm run db:seed     # importe 22 comptes + 67 mesures (une seule fois, idempotent)
npm run dev         # http://localhost:3000
```

### Comptes initiaux

- **Admins** : Loïck Ferrucci, Julie De Breza
- **20 élus contributeurs** (la majorité)
- Mot de passe temporaire commun = valeur de `SEED_PASSWORD` dans `.env`. À changer à la 1re connexion.

## Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Connexion Postgres. En local : `DATABASE_PUBLIC_URL` de Railway. En prod : référence interne Railway. |
| `SESSION_SECRET` | Clé de signature des cookies de session (`openssl rand -hex 32`). |
| `SEED_PASSWORD` | Mot de passe temporaire des comptes à l'import initial. |

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build de production |
| `npm start` | Serveur de production |
| `npm test` | Tests unitaires (logique métier) |
| `npm run db:deploy` | Applique les migrations (additif uniquement) |
| `npm run db:seed` | Import initial idempotent |
| `npm run db:studio` | Explorateur de base Prisma |

## Déploiement Railway

1. Le code est sur GitHub (`LF38180/SUIVI-SNS`), branche `main`.
2. Sur Railway : 2 services dans le même projet — **le service web** (depuis le repo GitHub) et **la base PostgreSQL** (service séparé, volume persistant).
3. Sur le service web, onglet **Variables** :
   - `DATABASE_URL` → `${{ Postgres.DATABASE_URL }}` (référence interne au service Postgres)
   - `SESSION_SECRET` → une vraie clé secrète
   - `SEED_PASSWORD` → mot de passe temporaire
4. **Build command** : `npm run build`
5. **Start command** : `npm run db:deploy && npm start`
   - `db:deploy` applique uniquement les migrations additives. **Jamais de reset.**
6. **Le seed ne tourne PAS au déploiement.** Après le 1er déploiement, lancer une seule fois `npm run db:seed` (depuis Railway ou en local pointant sur la base de prod).

### Garantie : zéro perte de données au redéploiement

Code et données sont séparés. Redéployer = remplacer le code, jamais toucher la base.

- La base Postgres est un **service Railway distinct** à volume persistant : redéployer l'app ne la redémarre pas.
- `db:deploy` n'applique que des migrations **additives** ; aucune commande destructive dans les scripts.
- Le seed est **idempotent** (`if (count > 0) skip`) : il n'écrase jamais les avancements saisis.
- La table `Historique` est **append-only** (inaltérabilité §8.5).

Voir `docs/sauvegarde.md` pour la procédure de sauvegarde et les commandes interdites.

## Documentation

- `docs/guide-utilisateur.md` — guide 1 page (proposer / valider)
- `docs/sauvegarde.md` — sauvegarde et garde-fous anti-perte
- `docs/superpowers/specs/` — cahier de conception
- `docs/superpowers/plans/` — plan d'implémentation
