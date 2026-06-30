# Notice de reprise & registre des accès (IMPORTANT)

> Ce document garantit que l'outil **survit même si une personne devient indisponible**.
> Il doit être détenu par **au moins 2 personnes de confiance** (Loïck + Julie).
> ⚠️ Ne pas mettre les mots de passe en clair ICI dans le repo. Les mettre dans un
> **gestionnaire de mots de passe partagé** (Bitwarden gratuit, ou coffre équivalent).

---

## 1. Qui détient quoi (à remplir et tenir à jour)

| Accès | Détenteur 1 | Détenteur 2 | Où est stocké le secret |
|---|---|---|---|
| Compte **GitHub** (LF38180/SUIVI-SNS) | Loïck | Julie ? | Bitwarden partagé |
| Compte **Railway** (projet ideal-comfort + base Postgres) | Loïck | Julie ? | Bitwarden partagé |
| Compte **Backblaze B2** (sauvegardes) | Loïck | Julie ? | Bitwarden partagé |
| **SESSION_SECRET** (variable Railway) | — | — | Variables Railway + Bitwarden |
| **BACKUP_PASSPHRASE** (déchiffre les sauvegardes) | — | — | Bitwarden partagé UNIQUEMENT (hors Railway, hors GitHub) |
| Comptes **admin** de l'app | Loïck | Julie | — |

> Sans la `BACKUP_PASSPHRASE`, les sauvegardes sont illisibles. C'est la clé la plus
> importante : elle doit être connue de 2 personnes et stockée hors de Railway/GitHub.

---

## 2. Où sont les sauvegardes

- **Quoi :** copie chiffrée et compressée de toute la base, chaque jour.
- **Où :** Backblaze B2, bucket `sns-sauvegardes`, fichiers `sns-backup-AAAA-MM-JJ_HHMM.sql.gz.gpg`.
- **Quand :** tous les jours ~03:00 UTC, via GitHub Actions (`.github/workflows/backup.yml`).
- **Rétention :** les 30 dernières sauvegardes (les plus anciennes sont supprimées).
- **Lancer une sauvegarde à la main :** GitHub → onglet **Actions** → « Sauvegarde quotidienne » → **Run workflow**.

---

## 3. Comment restaurer (en cas de catastrophe)

Prérequis : avoir `psql`, `aws` (awscli) et `gpg` installés, et les secrets B2 + `BACKUP_PASSPHRASE`.

1. Lister les sauvegardes disponibles (depuis Backblaze, ou en ligne de commande) et noter le nom du fichier voulu.
2. Restaurer vers une base (de test d'abord !) :
   ```bash
   B2_KEY_ID=... B2_APP_KEY=... B2_BUCKET=sns-sauvegardes B2_ENDPOINT=s3.us-west-XXX.backblazeb2.com \
   BACKUP_PASSPHRASE=... CIBLE_DATABASE_URL=postgresql://... \
   bash scripts/restore.sh sns-backup-2026-07-01_0300.sql.gz.gpg
   ```
3. Vérifier que les données sont là (nombre de mesures, de comptes), PUIS basculer la prod si besoin.

> **Règle d'or :** une sauvegarde non testée n'existe pas. Faire une vraie restauration de
> test au moins **une fois maintenant**, puis tous les 6 mois.

---

## 4. Recréer l'app ailleurs si Railway disparaît

1. Cloner le repo GitHub `LF38180/SUIVI-SNS`.
2. Créer une base Postgres ailleurs (Neon, Render, Fly… offres gratuites).
3. Restaurer la dernière sauvegarde dans cette base (voir §3).
4. Déployer le code (Render/Fly/Vercel+Postgres) avec les variables : `DATABASE_URL`, `SESSION_SECRET`, `SEED_PASSWORD`.
5. Start command : `npm run start:prod` (migre puis démarre).

---

## 5. Contacts techniques

- Développement initial : assistant IA (Claude) — le code est documenté et standard (Next.js + Prisma).
- En cas de besoin d'un développeur : tout est en TypeScript/Next.js/PostgreSQL, technologies courantes.
