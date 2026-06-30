# 📖 LISEZ-MOI D'ABORD — Tout savoir sur l'application Suivi SNS

> Document maître. En cas de problème, de reprise, ou si tu as oublié comment ça marche : **commence ici.**
> Application de suivi du programme municipal Seyssins Nature & Solidaire 2026-2032.

---

## 1. C'est quoi, en une phrase

Une application web pour suivre l'avancement des **67 engagements** du programme du groupe SNS : les élus proposent des mises à jour, deux administrateurs valident, et les habitants voient une vue publique. **Outil du groupe politique, pas de la mairie.**

---

## 2. Les liens essentiels

| Quoi | Où |
|---|---|
| **L'application en ligne** | https://suivi-sns-production.up.railway.app |
| **Le code source** | GitHub : https://github.com/LF38180/SUIVI-SNS |
| **Hébergement (app + base de données)** | Railway — projet `ideal-comfort` |
| **Sauvegardes** | Backblaze B2 — bucket `sns-sauvegardes` (région UE) |
| **Vérifier que tout va bien** | https://suivi-sns-production.up.railway.app/api/health (doit afficher `"db":"ok"`) |

---

## 3. Comment se connecter

- **Admins :** Loïck Ferrucci, Julie De Breza
- **Élus :** `prenom.nom@mairie-seyssins.fr`
- À la 1re connexion : un bandeau invite à choisir son propre mot de passe (Menu « Mon compte »).
- **Mot de passe oublié ?** Un admin le réinitialise depuis Espace admin → Gérer les comptes → « Réinit. mot de passe ».

---

## 4. Qui peut faire quoi

- **Visiteur public** (sans connexion) : voit la page `/public` (avancements validés uniquement).
- **Élu** : voit « Mes mesures », propose des avancements + photos (qui passent en validation), suit ses propositions.
- **Admin** : valide/refuse, gère les mesures, les comptes, voit tout.

**Le cœur :** un élu propose → ça arrive dans la file « À valider » de l'admin → l'admin valide (ça devient officiel + historique inaltérable) ou refuse (avec motif).

---

## 5. Mettre à jour le code (faire une modification)

```
git add -A
git commit -m "description"
git push
```
→ Railway redéploie tout seul (~2 min). **Aucune manipulation dans Railway.** Détails : `docs/comment-mettre-a-jour.md`.

---

## 6. 🔴 EN CAS DE PROBLÈME

### L'app ne répond pas / affiche une erreur
1. Vérifier https://suivi-sns-production.up.railway.app/api/health
2. Railway → service SUIVI-SNS → onglet **Deployments** → regarder les logs du dernier déploiement.
3. Bouton **Rollback** sur un déploiement précédent qui marchait = retour arrière immédiat (les données ne sont PAS touchées).

### Les données semblent perdues / il faut restaurer une sauvegarde
→ **Procédure complète dans `docs/reprise-et-acces.md`** (section « Comment restaurer »).
Résumé : les sauvegardes chiffrées sont sur Backblaze (1 par jour, 30 conservées). Pour les lire il faut la **`BACKUP_PASSPHRASE`** (voir §7).

### Railway a disparu / il faut tout recréer ailleurs
→ `docs/reprise-et-acces.md`, section « Recréer l'app ailleurs ». Le code est standard (Next.js + PostgreSQL), n'importe quel développeur peut reprendre.

---

## 7. 🔑 LES ACCÈS ET SECRETS (À SÉCURISER)

**Aujourd'hui, seul Loïck détient tout.** En cas d'indisponibilité durable, le projet serait bloqué. À régler (voir `docs/reprise-et-acces.md`).

Secrets à conserver précieusement (dans un coffre, PAS dans ce fichier en clair) :
- Accès **GitHub** (LF38180)
- Accès **Railway** (compte + projet `ideal-comfort`)
- Accès **Backblaze B2**
- **`SESSION_SECRET`** (variable Railway — sécurise les connexions)
- **`BACKUP_PASSPHRASE`** (déchiffre les sauvegardes — LA PLUS IMPORTANTE, sans elle les sauvegardes sont illisibles à jamais)

⚠️ **Tâches de sécurité encore à faire :**
1. Noter la `BACKUP_PASSPHRASE` dans un endroit sûr.
2. Régénérer la clé applicative Backblaze (l'ancienne a circulé en clair lors de la mise en place).
3. Désigner un dépositaire des accès (enveloppe scellée suffit, voir `docs/reprise-et-acces.md`).

---

## 8. La technique (pour un développeur)

- **Stack :** Next.js 16 (App Router) + React 19 + TypeScript ; PostgreSQL 18 via Prisma 7 (adapter pg) ; hébergé Railway ; auth maison (cookie signé HMAC, bcrypt).
- **Charte :** orange `#EE6B3E` (`#C0461F` pour le texte), police Poppins (auto-hébergée), jauges circulaires, fond beige `#FAF7F4`.
- **Démarrage prod :** `npm run start:prod` (script `scripts/boot.mjs` : migre puis démarre, ne crashe jamais en boucle).
- **Tests :** `npm test` (Vitest — logique de statut, validation, permissions, auth, courbe d'évolution).
- **Migrations Prisma** (additives uniquement, jamais destructives) : dans `prisma/migrations/`.
- **Variables d'environnement** nécessaires : `DATABASE_URL`, `SESSION_SECRET`, `SEED_PASSWORD`. Modèle dans `.env.example`.
- **Données de départ :** `prisma/seed.ts` (idempotent — 22 comptes + 67 mesures à 0%). Lancer une seule fois : `npm run db:seed`.

---

## 9. Tous les documents du projet

| Fichier | Contenu |
|---|---|
| `LISEZ-MOI-DABORD.md` | **CE fichier** — le point d'entrée |
| `README.md` | Installation, déploiement, scripts |
| `docs/comment-mettre-a-jour.md` | Comment modifier et déployer (simple) |
| `docs/reprise-et-acces.md` | 🔴 Sauvegardes, restauration, accès, plan de reprise |
| `docs/sauvegarde.md` | Procédure de sauvegarde + commandes interdites |
| `docs/guide-utilisateur.md` | Guide 1 page pour les élus (proposer / valider) |
| `docs/table-ronde-finale.md` | Audit de 12 experts seniors + plan d'améliorations |
| `docs/test-21-elus.md` | Retours des 21 élus (test web + mobile) |
| `docs/ameliorations-panel-experts.md` | 1er panel d'experts (90 propositions) |
| `docs/ameliorations-mobile-panel.md` | Panel mobile (par type d'utilisateur) |
| `docs/propositions-experts-detail.md` | Détail des 90 propositions par expert |

---

## 10. Ce qui reste éventuellement à faire (non bloquant)

- Brancher les **emails** (rappels hebdo, mot de passe oublié auto) — demande un service type Resend.
- Un **nom de domaine** propre (ex. `suivi.seyssins-nature-solidaire.fr`).
- Le **bilan de mi-mandat** figeable (prévu à l'approche de 2029).
- Surveillance externe (UptimeRobot) — alerte si le site tombe.

---

*Document maître mis à jour le 1er juillet 2026. État : application complète, en ligne, sauvegardée, repartie de 0 pour le démarrage réel.*
