# Suivi SNS — récap technique pour concevoir un nouveau module

> À transmettre à une autre IA pour qu'elle propose COMMENT intégrer un module.
> L'implémentation sera faite ensuite dans l'app par Claude Code. Ce document
> décrit l'existant tel qu'il est réellement (octobre 2026).

## 1. Ce qu'est l'application

Application web de **suivi du programme municipal** du groupe « Seyssins Nature &
Solidaire » (majorité municipale, mandat 2026-2032). Elle suit l'avancement de
**67 engagements** répartis en 4 axes, plus des « initiatives hors programme ».
Les élus mettent à jour l'avancement et tiennent un journal de bord ; un
administrateur valide ; une vue publique assure la transparence ; des visuels de
communication (vignettes réseaux) sont générés automatiquement.

En production sur Railway (Europe), ~22 comptes (21 élus + directrice de cabinet).

## 2. Stack technique (exacte)

- **Next.js 16.2.9**, App Router, React 19.2, TypeScript. Turbopack.
  ⚠️ Next 16 a des différences avec les versions antérieures : `params`/`cookies`
  asynchrones, `proxy.ts` (runtime nodejs) à la place de `middleware.ts`,
  `revalidateTag(tag, profile)` à 2 arguments, etc.
- **PostgreSQL 18** via **Prisma 7.8** avec l'adapter `@prisma/adapter-pg`
  (client généré dans `src/generated/prisma`, gitignored, régénéré au build).
  Pas d'`url` dans schema.prisma ; `DATABASE_URL` via `prisma.config.ts`.
- **Auth maison** : cookie httpOnly signé HMAC (`sns_session`), bcryptjs,
  expiration 30 j, re-vérification en base à chaque lecture de session
  (révocation immédiate). Pas de service externe, pas d'email transactionnel.
- **Hébergement** : Railway (web service + Postgres). Déploiement = `git push`
  (migrations appliquées au boot par `scripts/boot.mjs`, avec garde-fou qui
  REFUSE une migration destructive non autorisée). Sauvegarde chiffrée
  quotidienne vers Backblaze B2 (GitHub Actions).
- **Règle absolue du projet** : aucune perte de données. Migrations toujours
  **additives** (jamais de DROP COLUMN/TABLE sans procédure dédiée).

## 3. Modèle de données (Prisma — modèles existants)

- **User** : `id, nom, email (unique), motDePasseHash, role, actif, fonction?,
  doitChangerMdp, deletedAt?, anonymiseLe?`.
- **Role (enum)** : `ADMIN` | `ELU`. ← **seulement deux rôles aujourd'hui.**
- **Mesure** : `id, categorie, rubrique, intitule, description?, natureCout?,
  ordreGrandeur?, besoins?, limites?, echeanceCible?, avancementPublie (0-100),
  ordre, deletedAt?, situation (NORMALE/REPORTEE/ADAPTEE/ABANDONNEE),
  situationMotif?, coutPublic, limitesPublic, proposeeParId?, statutMesure
  (EN_ATTENTE/VALIDEE/REFUSEE), motifRefus?`.
- **Categorie (enum)** : `AXE_1..AXE_4` | `HORS_PROGRAMME`.
- **MesureResponsable** (jonction N-N, modèle « à plat ») : `(mesureId, userId,
  role)` avec `RoleSurMesure = RESPONSABLE | CONCERNE`. C'est ce qui relie les
  élus aux mesures et ce qui alimente « Mes mesures ».
- **Proposition** : mise à jour d'avancement proposée par un élu (avancement,
  commentaire = « mot de l'élu », statut EN_ATTENTE/VALIDEE/REFUSEE, validée par…).
- **JournalEntree** : action datée saisie par un élu (reporting, sans validation).
- **PieceJointe** + **PieceJointeBlob** : photos/documents (base64 isolé dans une
  table blob), avec statut de validation + soft-delete.
- **Historique** : append-only, chaque validation d'avancement (pour la courbe).
- **Notification** : notifications in-app (cloche).
- **AuditLog** : trace des actions sensibles (qui, quoi, quand).
- **Parametre** : réglages clé/valeur (ex. partage réseaux activé).
- **MesureCoReferent** : ancien modèle de co-référents, CONSERVÉ mais plus lu
  (remplacé par MesureResponsable).

## 4. Rôles & permissions (`src/lib/permissions.ts`)

Tout repose sur 4 fonctions prenant le rôle (`ADMIN`/`ELU`) :
- `peutValider` → ADMIN (valider propositions/photos/initiatives)
- `peutProposer` → ADMIN+ELU
- `peutGererComptes` → ADMIN
- `peutGererMesures` → ADMIN (éditer référents, visibilité publique…)

La session (`src/lib/session.ts`, `lireSession()`) renvoie `{ userId, role }`,
le rôle venant TOUJOURS de la base. Les pages/routes protégées vérifient la
session + la permission en tête, sinon `redirect('/')` ou 401/403.

**Point important pour le nouveau module** : il n'existe PAS aujourd'hui de
notion de « élu moyens généraux ». Le sous-groupe voulu (Loïck Ferrucci, Marie
Garrigos-Leclerc, Pierre Chevrier) + les admins devra être défini — soit par un
nouveau rôle/flag, soit par une liste, soit via le champ `fonction`. À proposer.

## 5. Pages & routes existantes

Pages publiques : `/connexion`, `/public`, `/mentions-legales`.
Espace élu : `/mes-mesures`, `/mesures`, `/mesures/[id]` (fiche), `/par-elu`,
`/compte`, `/presentation`, `/` (tableau de bord).
Espace admin (ADMIN only) : `/admin`, `/admin/validations`, `/admin/mesures`
(+`/[id]`), `/admin/comptes`, `/admin/echeances`, `/admin/communication`,
`/admin/audit`. Plus `/demo` (mode démonstration).

Routes API (`/api/...`) : auth (login/logout), mesures (CRUD + validation +
champs-elu + journal + image-partage), propositions, pieces-jointes, comptes,
compte/mot-de-passe, notifications, parametres, export/csv, bilan/image,
relancer, health.

Le contrôle d'accès des routes API passe toujours par `lireSession()` +
fonction de permission. `proxy.ts` protège toutes les routes sauf une liste
publique (connexion, public, mentions, api/auth, health, images de partage).

## 6. Conventions de code (à respecter par le module)

- Composants serveur par défaut ; `'use client'` seulement si interactif.
- UI à la **charte SNS** : orange `#EE6B3E` (texte accessible `#C0461F`), fond
  crème `#FAF7F4`, encre `#232326`, police Poppins. Mobile d'abord, cibles
  tactiles ≥ 44 px.
- Écritures sensibles → tracées dans l'AuditLog.
- Les mutations à deux écritures passent par `prisma.$transaction`.
- Chaque nouveau champ = migration Prisma **additive** (ADD COLUMN/TABLE),
  jamais destructive.

## 7. Ce qu'on veut (le nouveau module)

Un module **réservé à un sous-groupe** : les trois élus « moyens généraux »
(Loïck Ferrucci, Marie Garrigos-Leclerc, Pierre Chevrier) **et** les
administrateurs. Invisible/inaccessible pour les autres élus.

[À COMPLÉTER PAR LOÏCK : décrire ici précisément ce que fait le module — quelles
données il gère, quelles pages/écrans, quelles actions, s'il doit être public ou
interne, s'il croise les mesures existantes ou s'il est indépendant.]

## 8. La question posée à l'autre IA

Compte tenu de cet existant (Next 16 + Prisma 7 + rôles ADMIN/ELU + permissions
centralisées + règle « aucune perte de données » + migrations additives), **comment
intégrer proprement ce module réservé au sous-groupe ?** En particulier :

1. Comment modéliser l'appartenance au sous-groupe « moyens généraux » sans
   casser le système de rôles actuel (nouveau rôle ? flag booléen sur User ?
   table d'appartenance ? liste d'emails en dur ?) — avec les avantages/risques.
2. Comment exposer ce module (nouvelle section d'espace, nouvelles pages, entrée
   de menu conditionnelle) en réutilisant le contrôle d'accès existant
   (`lireSession` + une nouvelle fonction `peutAccederMoyensGeneraux`).
3. Le schéma de données du module (modèles/champs Prisma additifs).
4. Les points de vigilance (sécurité d'accès côté page ET côté API, proxy,
   audit, migration non destructive).

Réponds par une proposition d'architecture et un plan d'intégration ; le code
sera écrit ensuite par Claude Code dans le dépôt.
