# Suivi Programme SNS — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Application web Next.js de suivi des 67 engagements du programme SNS 2026-2032, avec circuit de validation admin, rôles, vue publique, sur Postgres/Railway.

**Architecture:** App Next.js unique (App Router) = front + API (Route Handlers). Postgres via Prisma. Auth maison (cookie httpOnly signé, bcrypt). Permissions vérifiées côté serveur. Données et code strictement séparés : redéployer ne touche jamais la base (migrations additives, seed idempotent, historique append-only).

**Tech Stack:** Next.js 15 (App Router) · TypeScript · React · Prisma · PostgreSQL (Railway) · bcrypt · Vitest (tests) · CSS variables (charte SNS).

**Référence design :** `docs/superpowers/specs/2026-06-29-suivi-programme-sns-design.md` + prototype HTML fourni.

---

## Structure des fichiers

```
suivi-sns/
├── prisma/
│   ├── schema.prisma            # modèle de données
│   └── seed.ts                  # import idempotent (67 mesures + 22 comptes)
├── src/
│   ├── lib/
│   │   ├── db.ts                # client Prisma singleton
│   │   ├── statut.ts            # calcul statut dérivé (testé)
│   │   ├── auth.ts              # hash, vérif mdp, session cookie (testé)
│   │   ├── session.ts          # lecture/écriture cookie session
│   │   └── permissions.ts      # gardes par rôle (testé)
│   ├── data/
│   │   ├── mesures.ts           # les 67 mesures en dur (source seed)
│   │   └── elus.ts              # les 22 comptes en dur (source seed)
│   ├── middleware.ts           # protection des pages connectées
│   ├── app/
│   │   ├── globals.css          # charte SNS (variables + composants)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # tableau de bord
│   │   ├── connexion/page.tsx
│   │   ├── public/page.tsx
│   │   ├── mesures/page.tsx
│   │   ├── mesures/[id]/page.tsx
│   │   ├── par-elu/page.tsx
│   │   ├── admin/validations/page.tsx
│   │   ├── admin/mesures/page.tsx
│   │   ├── admin/comptes/page.tsx
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── propositions/route.ts          # POST créer proposition
│   │       ├── propositions/[id]/route.ts     # PATCH valider/refuser
│   │       ├── journal/route.ts               # POST entrée journal
│   │       └── pieces-jointes/route.ts        # POST upload
│   └── components/
│       ├── Jauge.tsx            # donut SVG
│       ├── Barre.tsx           # barre de progression
│       ├── BadgeStatut.tsx
│       ├── CarteMesure.tsx
│       └── EnTete.tsx
└── tests/
    ├── statut.test.ts
    ├── auth.test.ts
    ├── permissions.test.ts
    └── validation.test.ts       # circuit proposition → publié + historique
```

---

## Phase 0 — Échafaudage du projet

### Task 0.1 : Initialiser le projet Next.js + TypeScript

**Files:**
- Create: tout le squelette Next.js dans `suivi-sns/`

- [ ] **Step 1: Créer le projet Next.js**

Run depuis `/Users/loickferrucci/Desktop/suivi-sns` (le dossier existe déjà avec docs/) :
```bash
cd /Users/loickferrucci/Desktop/suivi-sns
npx create-next-app@latest . --typescript --app --no-tailwind --no-src-dir=false --import-alias "@/*" --eslint --no-turbopack
```
Répondre : src dir = Yes, App Router = Yes. Si l'outil refuse à cause de fichiers existants (docs/), accepter de continuer.

Expected: dossier `src/app/`, `package.json`, `tsconfig.json` créés.

- [ ] **Step 2: Vérifier que ça démarre**

Run: `npm run dev`
Expected: serveur sur http://localhost:3000, page Next.js par défaut. Arrêter (Ctrl+C).

- [ ] **Step 3: Commit**

```bash
git init 2>/dev/null; git add -A
git commit -m "chore: scaffold Next.js + TypeScript project"
```

### Task 0.2 : Installer dépendances + Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Installer les libs**

```bash
npm install @prisma/client bcryptjs
npm install -D prisma vitest @types/bcryptjs tsx
```

- [ ] **Step 2: Config Vitest**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

- [ ] **Step 3: Ajouter scripts dans package.json**

Dans `package.json`, section `"scripts"`, ajouter (NE PAS ajouter de commande destructive type migrate reset) :
```json
"test": "vitest run",
"test:watch": "vitest",
"db:migrate": "prisma migrate dev",
"db:deploy": "prisma migrate deploy",
"db:seed": "tsx prisma/seed.ts",
"db:studio": "prisma studio"
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add prisma, bcrypt, vitest deps and scripts"
```

### Task 0.3 : Connexion Railway + variables d'environnement

**Files:**
- Create: `.env`, `.env.example`, modify `.gitignore`

- [ ] **Step 1: Vérifier .gitignore**

S'assurer que `.gitignore` contient `.env` (create-next-app l'ajoute normalement). Sinon l'ajouter. Le `.env` ne doit JAMAIS être commité (contient DATABASE_URL et secret session).

- [ ] **Step 2: Créer .env.example**

Create `.env.example`:
```
# Railway Postgres connection string (Connect → Postgres → DATABASE_URL)
DATABASE_URL="postgresql://user:pass@host:port/db"
# Secret pour signer les cookies de session (générer: openssl rand -hex 32)
SESSION_SECRET="change-me"
# Mot de passe temporaire commun à l'import initial
SEED_PASSWORD="change-me-temp"
```

- [ ] **Step 3: ACTION COMMANDITAIRE — créer le projet Railway**

L'utilisateur doit :
1. Créer un compte sur railway.app (gratuit).
2. New Project → Provision PostgreSQL.
3. Onglet Postgres → Variables → copier `DATABASE_URL` (URL publique).
4. Coller dans un fichier `.env` local (copié de `.env.example`), remplir aussi `SESSION_SECRET` (`openssl rand -hex 32`) et `SEED_PASSWORD`.

⚠️ Cette étape nécessite une action manuelle de l'utilisateur. Marquer une pause ici si `.env` absent.

- [ ] **Step 4: Commit (sans le .env)**

```bash
git add .env.example .gitignore
git commit -m "chore: add env template (railway postgres + session secret)"
```

---

## Phase 1 — Modèle de données

### Task 1.1 : Schéma Prisma

**Files:**
- Create: `prisma/schema.prisma`
- Create: `src/lib/db.ts`

- [ ] **Step 1: Écrire le schéma**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  ELU
}

enum Categorie {
  AXE_1
  AXE_2
  AXE_3
  AXE_4
  HORS_PROGRAMME
}

enum TypePiece {
  PHOTO
  DOCUMENT
  LIEN
}

enum StatutProposition {
  EN_ATTENTE
  VALIDEE
  REFUSEE
}

model User {
  id             Int     @id @default(autoincrement())
  nom            String
  email          String  @unique
  motDePasseHash String
  role           Role    @default(ELU)
  actif          Boolean @default(true)
  fonction       String?

  mesuresReferent  Mesure[] @relation("Referent")
  mesuresAdjoint   Mesure[] @relation("Adjoint")
  propositions     Proposition[] @relation("Auteur")
  validations      Proposition[] @relation("Validateur")
  journalEntrees   JournalEntree[]
  piecesJointes    PieceJointe[]
}

model Mesure {
  id                   Int       @id @default(autoincrement())
  categorie            Categorie
  rubrique             String
  intitule             String
  natureCout           String?
  ordreGrandeur        String?
  besoins              String?
  limites              String?
  echeanceCible        DateTime?
  avancementPublie     Int       @default(0)
  ordre                Int       @default(0)

  // visibilité champ par champ pour la vue publique (§8.4)
  coutPublic           Boolean   @default(false)
  limitesPublic        Boolean   @default(false)

  eluReferentId        Int?
  eluReferent          User?     @relation("Referent", fields: [eluReferentId], references: [id])
  adjointRattachementId Int?
  adjointRattachement  User?     @relation("Adjoint", fields: [adjointRattachementId], references: [id])

  propositions   Proposition[]
  journalEntrees JournalEntree[]
  piecesJointes  PieceJointe[]
  historique     Historique[]
}

model Proposition {
  id                Int               @id @default(autoincrement())
  mesureId          Int
  mesure            Mesure            @relation(fields: [mesureId], references: [id])
  auteurId          Int
  auteur            User              @relation("Auteur", fields: [auteurId], references: [id])
  avancementPropose Int
  commentaire       String?
  echeanceProposee  DateTime?
  statut            StatutProposition @default(EN_ATTENTE)
  motifRefus        String?
  valideeParId      Int?
  valideePar        User?             @relation("Validateur", fields: [valideeParId], references: [id])
  creeeLe           DateTime          @default(now())
  traiteeLe         DateTime?
}

model JournalEntree {
  id                Int      @id @default(autoincrement())
  mesureId          Int
  mesure            Mesure   @relation(fields: [mesureId], references: [id])
  auteurId          Int
  auteur            User     @relation(fields: [auteurId], references: [id])
  date              DateTime @default(now())
  commentaire       String
  avancementAssocie Int?
}

model PieceJointe {
  id          Int       @id @default(autoincrement())
  mesureId    Int
  mesure      Mesure    @relation(fields: [mesureId], references: [id])
  type        TypePiece
  url         String
  legende     String?
  ajouteeParId Int
  ajouteePar  User      @relation(fields: [ajouteeParId], references: [id])
  date        DateTime  @default(now())
}

// Append-only : aucun UPDATE/DELETE dans le code (inaltérabilité §8.5)
model Historique {
  id             Int      @id @default(autoincrement())
  mesureId       Int
  mesure         Mesure   @relation(fields: [mesureId], references: [id])
  ancienPourcent Int
  nouveauPourcent Int
  proposeParId   Int?
  valideeParId   Int?
  date           DateTime @default(now())
}
```

- [ ] **Step 2: Client Prisma singleton**

Create `src/lib/db.ts`:
```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 3: Générer + migrer (nécessite .env rempli)**

Run:
```bash
npx prisma generate
npm run db:migrate -- --name init
```
Expected: migration `init` créée dans `prisma/migrations/`, tables créées sur Railway.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations src/lib/db.ts
git commit -m "feat: prisma schema (users, mesures, propositions, journal, pieces, historique)"
```

---

## Phase 2 — Logique métier testée (TDD)

### Task 2.1 : Calcul du statut dérivé

**Files:**
- Create: `src/lib/statut.ts`
- Test: `tests/statut.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `tests/statut.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { statutDe } from '@/lib/statut'

describe('statutDe', () => {
  it('0 = Non démarré', () => {
    expect(statutDe(0).nom).toBe('Non démarré')
  })
  it('1 à 33 = Engagé', () => {
    expect(statutDe(1).nom).toBe('Engagé')
    expect(statutDe(33).nom).toBe('Engagé')
  })
  it('34 à 99 = En cours', () => {
    expect(statutDe(34).nom).toBe('En cours')
    expect(statutDe(99).nom).toBe('En cours')
  })
  it('100 = Réalisé', () => {
    expect(statutDe(100).nom).toBe('Réalisé')
  })
  it('renvoie la couleur de charte', () => {
    expect(statutDe(100).couleur).toBe('#3A8540')
    expect(statutDe(0).couleur).toBe('#9A9AA0')
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npm test -- tests/statut.test.ts`
Expected: FAIL ("statutDe is not a function" / module introuvable).

- [ ] **Step 3: Implémenter**

Create `src/lib/statut.ts`:
```ts
export type Statut = { nom: string; couleur: string }

const NON_DEMARRE: Statut = { nom: 'Non démarré', couleur: '#9A9AA0' }
const ENGAGE: Statut = { nom: 'Engagé', couleur: '#C98A1A' }
const EN_COURS: Statut = { nom: 'En cours', couleur: '#EE6B3E' }
const REALISE: Statut = { nom: 'Réalisé', couleur: '#3A8540' }

export function statutDe(avancement: number): Statut {
  const v = Math.max(0, Math.min(100, Math.round(avancement)))
  if (v <= 0) return NON_DEMARRE
  if (v < 34) return ENGAGE
  if (v < 100) return EN_COURS
  return REALISE
}

export const STATUTS = [NON_DEMARRE, ENGAGE, EN_COURS, REALISE]
```

- [ ] **Step 4: Lancer → succès**

Run: `npm test -- tests/statut.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/statut.ts tests/statut.test.ts
git commit -m "feat: derived status calculation (tested)"
```

### Task 2.2 : Hash et vérification de mot de passe

**Files:**
- Create: `src/lib/auth.ts`
- Test: `tests/auth.test.ts`

- [ ] **Step 1: Test qui échoue**

Create `tests/auth.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { hashMotDePasse, verifierMotDePasse } from '@/lib/auth'

describe('mots de passe', () => {
  it('hash puis vérifie correctement', async () => {
    const hash = await hashMotDePasse('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifierMotDePasse('secret123', hash)).toBe(true)
  })
  it('rejette un mauvais mot de passe', async () => {
    const hash = await hashMotDePasse('secret123')
    expect(await verifierMotDePasse('mauvais', hash)).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npm test -- tests/auth.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/lib/auth.ts`:
```ts
import bcrypt from 'bcryptjs'

export async function hashMotDePasse(clair: string): Promise<string> {
  return bcrypt.hash(clair, 10)
}

export async function verifierMotDePasse(clair: string, hash: string): Promise<boolean> {
  return bcrypt.compare(clair, hash)
}
```

- [ ] **Step 4: Lancer → succès**

Run: `npm test -- tests/auth.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth.ts tests/auth.test.ts
git commit -m "feat: password hashing and verification (tested)"
```

### Task 2.3 : Permissions par rôle

**Files:**
- Create: `src/lib/permissions.ts`
- Test: `tests/permissions.test.ts`

- [ ] **Step 1: Test qui échoue**

Create `tests/permissions.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { peutValider, peutProposer, peutGererComptes } from '@/lib/permissions'

describe('permissions', () => {
  it('admin peut valider', () => {
    expect(peutValider('ADMIN')).toBe(true)
    expect(peutValider('ELU')).toBe(false)
  })
  it('élu et admin peuvent proposer', () => {
    expect(peutProposer('ELU')).toBe(true)
    expect(peutProposer('ADMIN')).toBe(true)
  })
  it('seul admin gère les comptes', () => {
    expect(peutGererComptes('ADMIN')).toBe(true)
    expect(peutGererComptes('ELU')).toBe(false)
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npm test -- tests/permissions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter**

Create `src/lib/permissions.ts`:
```ts
export type Role = 'ADMIN' | 'ELU'

export function peutValider(role: Role): boolean {
  return role === 'ADMIN'
}
export function peutProposer(role: Role): boolean {
  return role === 'ADMIN' || role === 'ELU'
}
export function peutGererComptes(role: Role): boolean {
  return role === 'ADMIN'
}
export function peutGererMesures(role: Role): boolean {
  return role === 'ADMIN'
}
```

- [ ] **Step 4: Lancer → succès**

Run: `npm test -- tests/permissions.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/permissions.ts tests/permissions.test.ts
git commit -m "feat: role-based permission checks (tested)"
```

### Task 2.4 : Sessions cookie signées

**Files:**
- Create: `src/lib/session.ts`

- [ ] **Step 1: Implémenter (logique stateless signée HMAC)**

Create `src/lib/session.ts`:
```ts
import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE = 'sns_session'
const SECRET = process.env.SESSION_SECRET ?? 'dev-secret-change-me'

export type SessionData = { userId: number; role: 'ADMIN' | 'ELU' }

function signer(payload: string): string {
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  return `${payload}.${sig}`
}

function verifier(token: string): SessionData | null {
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const payload = token.slice(0, i)
  const sig = token.slice(i + 1)
  const attendu = crypto.createHmac('sha256', SECRET).update(payload).digest('hex')
  if (sig.length !== attendu.length) return null
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(attendu))) return null
  try {
    return JSON.parse(Buffer.from(payload, 'base64').toString()) as SessionData
  } catch {
    return null
  }
}

export async function creerSession(data: SessionData) {
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const token = signer(payload)
  ;(await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function lireSession(): Promise<SessionData | null> {
  const c = (await cookies()).get(COOKIE)
  if (!c) return null
  return verifier(c.value)
}

export async function detruireSession() {
  ;(await cookies()).delete(COOKIE)
}
```

- [ ] **Step 2: Vérifier compilation TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur sur session.ts.

- [ ] **Step 3: Commit**

```bash
git add src/lib/session.ts
git commit -m "feat: signed cookie sessions (HMAC)"
```

### Task 2.5 : Circuit de validation (cœur métier, testé)

**Files:**
- Create: `src/lib/validation.ts`
- Test: `tests/validation.test.ts`

- [ ] **Step 1: Test qui échoue (logique pure, sans DB)**

Create `tests/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { calculerEffetValidation, calculerEffetRefus } from '@/lib/validation'

describe('circuit de validation', () => {
  it('valider : publié devient la valeur proposée + entrée historique', () => {
    const r = calculerEffetValidation({ avancementPublie: 10, avancementPropose: 40 })
    expect(r.nouveauAvancementPublie).toBe(40)
    expect(r.entreeHistorique).toEqual({ ancienPourcent: 10, nouveauPourcent: 40 })
  })
  it('refuser : publié inchangé, pas d historique', () => {
    const r = calculerEffetRefus({ avancementPublie: 10 })
    expect(r.nouveauAvancementPublie).toBe(10)
    expect(r.entreeHistorique).toBeNull()
  })
  it('borne les valeurs hors limites', () => {
    const r = calculerEffetValidation({ avancementPublie: 0, avancementPropose: 150 })
    expect(r.nouveauAvancementPublie).toBe(100)
  })
})
```

- [ ] **Step 2: Lancer → échec**

Run: `npm test -- tests/validation.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implémenter (logique pure)**

Create `src/lib/validation.ts`:
```ts
function borner(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function calculerEffetValidation(input: {
  avancementPublie: number
  avancementPropose: number
}) {
  const nouveau = borner(input.avancementPropose)
  return {
    nouveauAvancementPublie: nouveau,
    entreeHistorique: { ancienPourcent: input.avancementPublie, nouveauPourcent: nouveau },
  }
}

export function calculerEffetRefus(input: { avancementPublie: number }) {
  return {
    nouveauAvancementPublie: input.avancementPublie,
    entreeHistorique: null,
  }
}
```

- [ ] **Step 4: Lancer → succès**

Run: `npm test -- tests/validation.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validation.ts tests/validation.test.ts
git commit -m "feat: validation workflow core logic (tested)"
```

---

## Phase 3 — Données + seed idempotent

### Task 3.1 : Données des 22 comptes

**Files:**
- Create: `src/data/elus.ts`

- [ ] **Step 1: Écrire les comptes**

Create `src/data/elus.ts` (rôle, email, nom, fonction). Les admins = Loïck + Julie. Le `referentKey` sert à relier les mesures :
```ts
export type EluSeed = {
  key: string          // identifiant court pour relier les mesures
  nom: string
  email: string
  role: 'ADMIN' | 'ELU'
  fonction: string
  adjointKey?: string  // binôme §4.3 : adjoint de rattachement
}

export const ELUS: EluSeed[] = [
  { key: 'ferrucci', nom: 'Loïck Ferrucci', email: 'loick.ferrucci@mairie-seyssins.fr', role: 'ADMIN', fonction: '3e adjoint, Moyens généraux' },
  { key: 'debreza', nom: 'Julie De Breza', email: 'julie.debreza@mairie-seyssins.fr', role: 'ADMIN', fonction: 'Directrice de cabinet' },
  { key: 'hugele', nom: 'Fabrice Hugelé', email: 'fabrice.hugele@mairie-seyssins.fr', role: 'ELU', fonction: 'Maire' },
  { key: 'paucod', nom: 'Jean-Marc Paucod', email: 'jean-marc.paucod@mairie-seyssins.fr', role: 'ELU', fonction: '1er adjoint, Éducation' },
  { key: 'baudin', nom: 'Isabelle Baudin', email: 'isabelle.baudin@mairie-seyssins.fr', role: 'ELU', fonction: '2e adjointe, Environnement' },
  { key: 'lombard', nom: 'Anne-Marie Lombard', email: 'anne-marie.lombard@mairie-seyssins.fr', role: 'ELU', fonction: '4e adjointe, Citoyenneté' },
  { key: 'cialdella', nom: 'Sylvain Cialdella', email: 'sylvain.cialdella@mairie-seyssins.fr', role: 'ELU', fonction: '5e adjoint, Affaires sociales' },
  { key: 'viton', nom: 'Carole Viton', email: 'carole.viton@mairie-seyssins.fr', role: 'ELU', fonction: '6e adjointe, Vie économique/Sport' },
  { key: 'courraud', nom: 'Emmanuel Courraud', email: 'emmanuel.courraud@mairie-seyssins.fr', role: 'ELU', fonction: '7e adjoint, Urbanisme/Mobilités' },
  { key: 'rouillon', nom: 'Rachel Rouillon', email: 'rachel.rouillon@mairie-seyssins.fr', role: 'ELU', fonction: '8e adjointe, Culture' },
  { key: 'garrigos', nom: 'Marie Garrigos-Leclerc', email: 'marie.garrigos-leclerc@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Contrôle de gestion', adjointKey: 'ferrucci' },
  { key: 'chevrier', nom: 'Pierre Chevrier', email: 'pierre.chevrier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, RH/ERP', adjointKey: 'ferrucci' },
  { key: 'jacquier', nom: 'Cyril Jacquier', email: 'cyril.jacquier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Énergie', adjointKey: 'baudin' },
  { key: 'cianci', nom: 'Mathieu Cianci', email: 'mathieu.cianci@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Restauration scolaire', adjointKey: 'paucod' },
  { key: 'collot', nom: 'Françoise Collot', email: 'francoise.collot@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Petite enfance', adjointKey: 'cialdella' },
  { key: 'gresil', nom: 'Delphine Gresil', email: 'delphine.gresil@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Personnes âgées', adjointKey: 'cialdella' },
  { key: 'bugier', nom: 'Sylvain Bugier', email: 'sylvain.bugier@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Bâtiments' },
  { key: 'shaiek', nom: 'Jihène Shaiek', email: 'jihene.shaiek@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseillère déléguée, Animations', adjointKey: 'rouillon' },
  { key: 'faucher', nom: 'Pascal Faucher', email: 'pascal.faucher@mairie-seyssins.fr', role: 'ELU', fonction: 'Conseiller délégué, Tranquillité publique' },
  { key: 'borre', nom: 'Célia Borré', email: 'celia.borre@mairie-seyssins.fr', role: 'ELU', fonction: 'Référente, Accessibilité' },
  { key: 'gilabert', nom: 'François Gilabert', email: 'francois.gilabert@mairie-seyssins.fr', role: 'ELU', fonction: 'Référent, Laïcité' },
  { key: 'ivars', nom: 'Ilona Ivars', email: 'ilona.ivars@mairie-seyssins.fr', role: 'ELU', fonction: 'Référente, Partenariats sportifs' },
]
```

- [ ] **Step 2: Commit**

```bash
git add src/data/elus.ts
git commit -m "feat: 22 user accounts seed data"
```

### Task 3.2 : Données des 67 mesures

**Files:**
- Create: `src/data/mesures.ts`

- [ ] **Step 1: Écrire les 67 mesures (Annexe C du cahier des charges)**

Create `src/data/mesures.ts`. Champs : axe, rubrique, intitulé, référent(s) → on prend le PREMIER référent comme `referentKey`, coût (natureCout/ordreGrandeur séparés du champ "Coût"), avancement de départ. Le mapping nom→key suit `src/data/elus.ts`.

```ts
export type MesureSeed = {
  categorie: 'AXE_1' | 'AXE_2' | 'AXE_3' | 'AXE_4' | 'HORS_PROGRAMME'
  rubrique: string
  intitule: string
  referentKey: string | null
  natureCout: string
  ordreGrandeur: string
  avancementPublie: number
}

export const MESURES: MesureSeed[] = [
  // ── AXE 1 — Protéger et garantir la qualité de vie (18) ──
  // Gérer avec sérieux et transparence
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Maîtriser la fiscalité locale dans la durée', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: "Renforcer les mutualisations et les groupements d'achats publics", referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'À chiffrer', avancementPublie: 5 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Mettre en place un plan stratégique de gestion du patrimoine communal', referentKey: 'ferrucci', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: 'Garantir un pilotage exigeant des projets municipaux', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 5 },
  { categorie: 'AXE_1', rubrique: 'Gérer avec sérieux et transparence', intitule: "Renforcer la transparence sur les coûts et l'efficacité des services municipaux", referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Ville apaisée et sécurité
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Poursuivre le déploiement de la vidéoprotection', referentKey: 'faucher', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 20 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Renforcer les patrouilles de police municipale', referentKey: 'faucher', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Pérenniser les médiateurs de proximité durant la période estivale', referentKey: 'faucher', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 30 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: 'Mettre en œuvre un plan global des cheminements piétons', referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 5 },
  { categorie: 'AXE_1', rubrique: 'Ville apaisée et sécurité', intitule: "Poursuivre un plan d'apaisement de la circulation", referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 15 },
  // Vie associative
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Maintenir un soutien financier stable et lisible aux associations', referentKey: 'viton', natureCout: '€ fonctionnement', ordreGrandeur: 'Élevé', avancementPublie: 10 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Consolider un partenariat de confiance avec les associations', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: 'Garantir un accès large et équitable aux équipements municipaux', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: 'Vie associative', intitule: "Valoriser et reconnaître l'engagement bénévole", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Pouvoir d'achat
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: 'Maintenir une fiscalité communale maîtrisée et prévisible', referentKey: 'ferrucci', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: "Expérimenter des dispositifs de bons d'achat municipaux (commerces locaux)", referentKey: 'viton', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: 'Développer un outil de valorisation du commerce local', referentKey: 'viton', natureCout: '€ invest. + fonct.', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_1', rubrique: "Pouvoir d'achat", intitule: "Étudier la mise en place d'offres collectives (esprit mutuelle communale)", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },

  // ── AXE 2 — Prendre soin de chacun (18) ──
  // Offre de santé
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Faire aboutir le projet de maison de santé pluridisciplinaire à la Plaine', referentKey: 'cialdella', natureCout: '€ investissement', ordreGrandeur: 'À chiffrer', avancementPublie: 5 },
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Renforcer la prévention santé pour tous les publics', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Offre de santé', intitule: 'Faciliter la coordination locale des acteurs de santé', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  // Bien vieillir
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: "Étudier l'implantation d'une résidence seniors adaptée", referentKey: 'gresil', natureCout: '€ investissement', ordreGrandeur: 'À chiffrer', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: "Renforcer le maintien à domicile et l'accompagnement de proximité", referentKey: 'gresil', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 10 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Soutenir les aidants familiaux', referentKey: 'gresil', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Développer des actions intergénérationnelles structurées', referentKey: 'gresil', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Bien vieillir', intitule: 'Mettre en place des espaces municipaux rafraîchis dans les écoles', referentKey: 'gresil', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  // Familles et jeunesse
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: "Soutenir les familles modestes dans l'accès aux activités sportives et culturelles", referentKey: 'cialdella', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Consolider les actions de soutien à la parentalité', referentKey: 'collot', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 10 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Pérenniser les jobs citoyens', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 10 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Créer une bourse aux projets pour les 15-18 ans', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Familles et jeunesse', intitule: 'Soutenir et valoriser le Conseil Municipal des Jeunes', referentKey: 'paucod', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 10 },
  // Solidarités
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Maintenir le conseiller numérique au CCAS', referentKey: 'cialdella', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 10 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: "Développer les actions « d'aller vers »", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Mieux informer sur les missions et dispositifs du CCAS', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: "Encourager l'économie sociale et solidaire", referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_2', rubrique: 'Solidarités', intitule: 'Créer une journée citoyenne des solidarités', referentKey: 'cialdella', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },

  // ── AXE 3 — Animer tous les quartiers (17) ──
  // Sport et culture
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Poursuivre la rénovation progressive des équipements structurants', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 15 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Garantir un accès équitable aux équipements sportifs et culturels', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Développer le sport santé et encourager les pratiques inclusives', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: 'Renforcer les échanges entre associations', referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Sport et culture', intitule: "Valoriser la culture comme vecteur de citoyenneté et d'ouverture", referentKey: 'rouillon', natureCout: '€ fonctionnement', ordreGrandeur: 'Faible', avancementPublie: 5 },
  // Événements festifs
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Consolider et moderniser les grands rendez-vous et les temps festifs communaux', referentKey: 'shaiek', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 10 },
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Associer davantage les associations et les commerçants', referentKey: 'shaiek', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 5 },
  { categorie: 'AXE_3', rubrique: 'Événements festifs', intitule: 'Valoriser le patrimoine et les savoir-faire locaux', referentKey: 'rouillon', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Commerce de proximité
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: "Soutenir l'animation commerciale", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 5 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: 'Améliorer l’attractivité de nos centralités commerciales', referentKey: 'viton', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: 'Développer des outils de valorisation du commerce local', referentKey: 'viton', natureCout: '€ invest. + fonct.', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Commerce de proximité', intitule: "Veiller à la diversité de l'offre commerciale", referentKey: 'viton', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 0 },
  // Démocratie participative
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Maintenir et renforcer les instances participatives existantes', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Adapter les concertations aux projets', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 10 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Garantir une représentation équilibrée des quartiers', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: 'Associer davantage les jeunes aux grands projets communaux', referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_3', rubrique: 'Démocratie participative', intitule: "Conforter le rôle du Comité d'Évaluation Citoyenne (CECi)", referentKey: 'lombard', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 5 },

  // ── AXE 4 — Préparer l'avenir (14) ──
  // Écoles et climat
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: "Améliorer durablement le confort d'été dans les écoles", referentKey: 'paucod', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 10 },
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: 'Sécuriser durablement les abords des écoles', referentKey: 'faucher', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 10 },
  { categorie: 'AXE_4', rubrique: 'Écoles et climat', intitule: 'Moderniser le patrimoine scolaire (achever Blanche-Rochas, décider la suite)', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 40 },
  // Énergie
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Rénover les bâtiments communaux les plus énergivores', referentKey: 'ferrucci', natureCout: '€ investissement', ordreGrandeur: 'Élevé', avancementPublie: 15 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Mettre en œuvre une stratégie pluriannuelle de rénovation énergétique', referentKey: 'ferrucci', natureCout: '€ fonctionnement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: 'Développer les énergies renouvelables locales', referentKey: 'jacquier', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Énergie', intitule: "Finaliser la modernisation de l'éclairage public et des bâtiments municipaux", referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 50 },
  // Adaptation climatique
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Créer des îlots de fraîcheur dans les lieux de sociabilité', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 10 },
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Transformer progressivement les espaces les plus minéralisés', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 5 },
  { categorie: 'AXE_4', rubrique: 'Adaptation climatique', intitule: 'Économiser durablement la ressource en eau', referentKey: 'baudin', natureCout: '€ investissement', ordreGrandeur: 'Faible', avancementPublie: 0 },
  // Urbanisme
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Défendre un urbanisme maîtrisé et raisonné', referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 10 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Favoriser un parcours résidentiel équilibré', referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Faible', avancementPublie: 0 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: "Garantir toujours la concertation sur les projets d'aménagement", referentKey: 'courraud', natureCout: 'Temps agent', ordreGrandeur: 'Interne', avancementPublie: 5 },
  { categorie: 'AXE_4', rubrique: 'Urbanisme', intitule: 'Favoriser des mobilités plus douces et sécurisées', referentKey: 'courraud', natureCout: '€ investissement', ordreGrandeur: 'Moyen', avancementPublie: 5 },
]
```

- [ ] **Step 2: Vérifier le décompte**

Run:
```bash
npx tsx -e "import {MESURES} from './src/data/mesures.ts'; const c={AXE_1:0,AXE_2:0,AXE_3:0,AXE_4:0,HORS_PROGRAMME:0}; MESURES.forEach(m=>c[m.categorie]++); console.log(c, 'total', MESURES.length)"
```
Expected: `{ AXE_1: 18, AXE_2: 18, AXE_3: 17, AXE_4: 14, HORS_PROGRAMME: 0 } total 67`

- [ ] **Step 3: Commit**

```bash
git add src/data/mesures.ts
git commit -m "feat: 67 program measures seed data (verified 18+18+17+14)"
```

### Task 3.3 : Script de seed idempotent

**Files:**
- Create: `prisma/seed.ts`

- [ ] **Step 1: Écrire le seed protégé**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from '@prisma/client'
import { hashMotDePasse } from '../src/lib/auth'
import { ELUS } from '../src/data/elus'
import { MESURES } from '../src/data/mesures'

const prisma = new PrismaClient()

async function main() {
  // PROTECTION : ne jamais réécraser des données existantes (idempotent)
  const nbUsers = await prisma.user.count()
  const nbMesures = await prisma.mesure.count()
  if (nbUsers > 0 || nbMesures > 0) {
    console.log(`Seed ignoré : base déjà peuplée (${nbUsers} comptes, ${nbMesures} mesures).`)
    return
  }

  const motTemp = process.env.SEED_PASSWORD ?? 'sns-temp-2026'
  const hash = await hashMotDePasse(motTemp)

  // 1) comptes
  const keyToId = new Map<string, number>()
  for (const e of ELUS) {
    const u = await prisma.user.create({
      data: { nom: e.nom, email: e.email, motDePasseHash: hash, role: e.role, fonction: e.fonction },
    })
    keyToId.set(e.key, u.id)
  }
  // binômes (adjoint de rattachement) — on stocke sur la mesure, pas sur le user ;
  // ici on garde juste la map pour les mesures
  const eluAdjoint = new Map<string, string | undefined>()
  for (const e of ELUS) eluAdjoint.set(e.key, e.adjointKey)

  // 2) mesures
  let ordre = 0
  for (const m of MESURES) {
    const refId = m.referentKey ? keyToId.get(m.referentKey) ?? null : null
    const adjKey = m.referentKey ? eluAdjoint.get(m.referentKey) : undefined
    const adjId = adjKey ? keyToId.get(adjKey) ?? null : null
    await prisma.mesure.create({
      data: {
        categorie: m.categorie,
        rubrique: m.rubrique,
        intitule: m.intitule,
        natureCout: m.natureCout,
        ordreGrandeur: m.ordreGrandeur,
        avancementPublie: m.avancementPublie,
        ordre: ordre++,
        eluReferentId: refId,
        adjointRattachementId: adjId,
      },
    })
  }
  console.log(`Seed terminé : ${ELUS.length} comptes, ${MESURES.length} mesures.`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 2: Lancer le seed (nécessite .env + migration faite)**

Run: `npm run db:seed`
Expected: "Seed terminé : 22 comptes, 67 mesures."

- [ ] **Step 3: Vérifier l'idempotence**

Run à nouveau: `npm run db:seed`
Expected: "Seed ignoré : base déjà peuplée (22 comptes, 67 mesures)."

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: idempotent seed (22 accounts + 67 measures, never overwrites)"
```

---

## Phase 4 — Charte SNS + composants visuels

### Task 4.1 : Variables CSS de la charte

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Remplacer globals.css par la charte SNS**

Remplacer tout le contenu de `src/app/globals.css` par les variables et styles de base du prototype HTML fourni (Annexe D) : couleurs SNS, police Poppins, classes `.panel`, `.bar`, `.card`, `.badge`, `.chip`, `.btn`, en-tête orange. Importer Poppins via `@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');` en tête.

(Reprendre verbatim les couleurs : `--orange:#EE6B3E; --orange-d:#CD5026; --fond:#FAF7F4; --dark:#232326; --grey:#6E6E73; --pale:#FCE9E1; --card:#FFFFFF; --line:#ECE5DF; --green:#3A8540; --amber:#C98A1A; --greyd:#9A9AA0;` et les règles `.bar`, `.bar i`, `.card`, `.badge`, `.chip`, `.btn`, `.panel`, header — voir le bloc style du prototype dans le cahier des charges, Annexe D.)

- [ ] **Step 2: Vérifier visuellement**

Run: `npm run dev`, ouvrir http://localhost:3000, confirmer fond beige + police Poppins. Arrêter.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: SNS brand charter CSS (colors, Poppins, base components)"
```

### Task 4.2 : Composants Jauge, Barre, BadgeStatut

**Files:**
- Create: `src/components/Jauge.tsx`, `src/components/Barre.tsx`, `src/components/BadgeStatut.tsx`

- [ ] **Step 1: Jauge donut**

Create `src/components/Jauge.tsx`:
```tsx
export function Jauge({ pourcent, taille = 138 }: { pourcent: number; taille?: number }) {
  const r = 60
  const c = 2 * Math.PI * r
  const offset = c * (1 - Math.max(0, Math.min(100, pourcent)) / 100)
  return (
    <div style={{ position: 'relative', width: taille, height: taille, flex: 'none' }}>
      <svg width={taille} height={taille} viewBox="0 0 138 138" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="69" cy="69" r={r} fill="none" stroke="#FCE9E1" strokeWidth="14" />
        <circle cx="69" cy="69" r={r} fill="none" stroke="#EE6B3E" strokeWidth="14"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset .7s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <b style={{ fontSize: 32, fontWeight: 800, color: '#EE6B3E', lineHeight: 1 }}>{Math.round(pourcent)}%</b>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Barre**

Create `src/components/Barre.tsx`:
```tsx
export function Barre({ pourcent }: { pourcent: number }) {
  const v = Math.max(0, Math.min(100, pourcent))
  return (
    <div style={{ height: 8, background: '#FCE9E1', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${v}%`, background: '#EE6B3E', borderRadius: 8, transition: 'width .6s cubic-bezier(.4,0,.2,1)' }} />
    </div>
  )
}
```

- [ ] **Step 3: BadgeStatut**

Create `src/components/BadgeStatut.tsx`:
```tsx
import { statutDe } from '@/lib/statut'

export function BadgeStatut({ avancement }: { avancement: number }) {
  const s = statutDe(avancement)
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, color: '#fff', background: s.couleur }}>
      {s.nom}
    </span>
  )
}
```

- [ ] **Step 4: Vérifier compilation**

Run: `npx tsc --noEmit`
Expected: pas d'erreur.

- [ ] **Step 5: Commit**

```bash
git add src/components/Jauge.tsx src/components/Barre.tsx src/components/BadgeStatut.tsx
git commit -m "feat: Jauge, Barre, BadgeStatut components (SNS charter)"
```

---

## Phase 5 — Authentification (pages + API)

### Task 5.1 : API login / logout

**Files:**
- Create: `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`

- [ ] **Step 1: Route login**

Create `src/app/api/auth/login/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifierMotDePasse } from '@/lib/auth'
import { creerSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, motDePasse } = await req.json()
  if (!email || !motDePasse) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } })
  if (!user || !user.actif || !(await verifierMotDePasse(motDePasse, user.motDePasseHash))) {
    return NextResponse.json({ erreur: 'Identifiants invalides' }, { status: 401 })
  }
  await creerSession({ userId: user.id, role: user.role })
  return NextResponse.json({ ok: true, role: user.role })
}
```

- [ ] **Step 2: Route logout**

Create `src/app/api/auth/logout/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { detruireSession } from '@/lib/session'

export async function POST() {
  await detruireSession()
  return NextResponse.json({ ok: true })
}
```

> Note : le login compare `email.toLowerCase()`. Le seed enregistre les emails tels quels (minuscules déjà). S'assurer que la création de comptes (Task 8.x) stocke aussi en minuscules.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/auth
git commit -m "feat: login/logout API routes"
```

### Task 5.2 : Page de connexion

**Files:**
- Create: `src/app/connexion/page.tsx`

- [ ] **Step 1: Page**

Create `src/app/connexion/page.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse }),
    })
    if (res.ok) router.push('/')
    else setErreur((await res.json()).erreur ?? 'Erreur')
  }

  return (
    <main style={{ maxWidth: 380, margin: '80px auto', padding: 22 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 18 }}>Connexion</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          required style={{ padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10 }} />
        <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
          required style={{ padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10 }} />
        {erreur && <div role="alert" style={{ color: '#CD5026', fontSize: 13 }}>{erreur}</div>}
        <button type="submit" className="btn primary" style={{ padding: '11px', background: '#EE6B3E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
          Se connecter
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Tester manuellement**

Run: `npm run dev`, aller sur /connexion, se connecter avec `loick.ferrucci@mairie-seyssins.fr` + le SEED_PASSWORD. Doit rediriger vers `/`.

- [ ] **Step 3: Commit**

```bash
git add src/app/connexion/page.tsx
git commit -m "feat: login page"
```

### Task 5.3 : Middleware de protection des pages

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 1: Middleware**

Create `src/middleware.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = ['/connexion', '/public']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // ressources publiques + api auth toujours accessibles
  if (
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }
  const cookie = req.cookies.get('sns_session')
  if (!cookie) {
    const url = req.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

> Note sécurité : le middleware vérifie la *présence* du cookie. La vérification de la *signature* et du *rôle* se fait côté serveur dans chaque page/route via `lireSession()` (le middleware Edge ne peut pas faire de crypto Node facilement). Les routes admin re-vérifient le rôle.

- [ ] **Step 2: Tester**

Run: `npm run dev`, en navigation privée aller sur `/` → doit rediriger vers `/connexion`. `/public` doit rester accessible.

- [ ] **Step 3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: page protection middleware (public paths whitelisted)"
```

---

## Phase 6 — Lecture des données : tableau de bord, mesures, vue publique

### Task 6.1 : Helpers de requête + agrégats

**Files:**
- Create: `src/lib/requetes.ts`

- [ ] **Step 1: Fonctions de lecture**

Create `src/lib/requetes.ts`:
```ts
import { prisma } from '@/lib/db'

export async function toutesLesMesures() {
  return prisma.mesure.findMany({
    orderBy: { ordre: 'asc' },
    include: { eluReferent: true, adjointRattachement: true },
  })
}

export function moyenne(valeurs: number[]): number {
  if (!valeurs.length) return 0
  return Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length)
}

export type AxeAgg = { axe: string; pourcent: number; nb: number; realisees: number }

export function agregatsParAxe(mesures: { categorie: string; avancementPublie: number }[]): AxeAgg[] {
  const axes = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4']
  return axes.map(a => {
    const ms = mesures.filter(m => m.categorie === a)
    return {
      axe: a,
      pourcent: moyenne(ms.map(m => m.avancementPublie)),
      nb: ms.length,
      realisees: ms.filter(m => m.avancementPublie >= 100).length,
    }
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/requetes.ts
git commit -m "feat: query helpers and per-axis aggregates"
```

### Task 6.2 : Noms d'axes + en-tête

**Files:**
- Create: `src/lib/axes.ts`, `src/components/EnTete.tsx`

- [ ] **Step 1: Noms d'axes**

Create `src/lib/axes.ts`:
```ts
export const NOMS_AXES: Record<string, string> = {
  AXE_1: 'Protéger et garantir la qualité de vie',
  AXE_2: 'Prendre soin de chacun',
  AXE_3: 'Animer tous les quartiers',
  AXE_4: "Préparer l'avenir",
  HORS_PROGRAMME: 'Initiatives du mandat',
}
```

- [ ] **Step 2: En-tête orange (charte)**

Create `src/components/EnTete.tsx`:
```tsx
export function EnTete({ titre, sousTitre }: { titre: string; sousTitre?: string }) {
  return (
    <header style={{ background: '#EE6B3E', color: '#fff', padding: '30px 0 34px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px' }}>
        <div style={{ fontWeight: 800, fontSize: 30, letterSpacing: '-.5px', lineHeight: 1 }}>
          Seyssins
          <small style={{ display: 'block', fontWeight: 400, fontSize: 15, opacity: .92, marginTop: 2 }}>
            Nature<b style={{ fontWeight: 700 }}>&amp;</b>Solidaire
          </small>
        </div>
        <h1 style={{ fontSize: 25, fontWeight: 700, marginTop: 18 }}>{titre}</h1>
        {sousTitre && <div style={{ fontSize: 14, opacity: .92, marginTop: 4, maxWidth: 640 }}>{sousTitre}</div>}
      </div>
    </header>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/axes.ts src/components/EnTete.tsx
git commit -m "feat: axis names map and SNS header component"
```

### Task 6.3 : Tableau de bord (page d'accueil)

**Files:**
- Modify/Create: `src/app/page.tsx`

- [ ] **Step 1: Page synthèse (Server Component)**

Create `src/app/page.tsx`:
```tsx
import { toutesLesMesures, moyenne, agregatsParAxe } from '@/lib/requetes'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { EnTete } from '@/components/EnTete'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe, STATUTS } from '@/lib/statut'

export default async function TableauDeBord() {
  const mesures = await toutesLesMesures()
  const global = moyenne(mesures.map(m => m.avancementPublie))
  const axes = agregatsParAxe(mesures)
  const counts = STATUTS.map(s => ({
    s, n: mesures.filter(m => statutDe(m.avancementPublie).nom === s.nom).length,
  }))

  return (
    <>
      <EnTete titre="Suivi du programme municipal 2026-2032"
        sousTitre="Là où nous en sommes, engagement par engagement." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <section style={{ marginTop: -34, position: 'relative', zIndex: 3, display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,2fr)', gap: 18 }}>
          <div className="panel">
            <h2>Avancement global</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <Jauge pourcent={global} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                {counts.map(({ s, n }) => (
                  <div key={s.nom} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: s.couleur }} />
                    <b>{n}</b> {s.nom}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="panel">
            <h2>Avancement par axe</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {axes.map(a => (
                <div key={a.axe} style={{ border: '1px solid #ECE5DF', borderRadius: 14, padding: '14px 15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#EE6B3E' }}>{a.axe.replace('_', ' ')}</span>
                    <span style={{ fontSize: 21, fontWeight: 800 }}>{a.pourcent}%</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 10px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
                  <Barre pourcent={a.pourcent} />
                  <div style={{ fontSize: 11, color: '#6E6E73', marginTop: 7 }}>{a.nb} mesures · {a.realisees} réalisée{a.realisees > 1 ? 's' : ''}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Tester**

Run: `npm run dev`, se connecter, voir le tableau de bord avec jauge globale + 4 axes alimentés par les vraies données.

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: dashboard with global gauge and per-axis cards"
```

### Task 6.4 : Liste des mesures avec filtres

**Files:**
- Create: `src/app/mesures/page.tsx`, `src/components/ListeMesures.tsx`

- [ ] **Step 1: Composant client de liste filtrable**

Create `src/components/ListeMesures.tsx`:
```tsx
'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Barre } from './Barre'
import { BadgeStatut } from './BadgeStatut'
import { statutDe } from '@/lib/statut'
import { NOMS_AXES } from '@/lib/axes'

export type MesureVue = {
  id: number; categorie: string; rubrique: string; intitule: string
  avancementPublie: number; referent: string | null
  natureCout: string | null; ordreGrandeur: string | null
}

export function ListeMesures({ mesures, referents }: { mesures: MesureVue[]; referents: string[] }) {
  const [axe, setAxe] = useState('')
  const [ref, setRef] = useState('')
  const [stat, setStat] = useState('')
  const [q, setQ] = useState('')

  const filtrees = useMemo(() => mesures.filter(m => {
    if (axe && m.categorie !== axe) return false
    if (ref && m.referent !== ref) return false
    if (stat && statutDe(m.avancementPublie).nom !== stat) return false
    if (q) {
      const h = `${m.intitule} ${m.referent ?? ''} ${m.rubrique}`.toLowerCase()
      if (!h.includes(q.toLowerCase())) return false
    }
    return true
  }), [mesures, axe, ref, stat, q])

  const axes = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4']

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
        <input type="search" placeholder="Rechercher une mesure, un élu…" value={q} onChange={e => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10 }} />
        <select value={ref} onChange={e => setRef(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10 }}>
          <option value="">Tous les référents</option>
          {referents.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={stat} onChange={e => setStat(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10 }}>
          <option value="">Tous les statuts</option>
          <option>Non démarré</option><option>Engagé</option><option>En cours</option><option>Réalisé</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
        {['', ...axes].map(a => (
          <button key={a || 'tous'} onClick={() => setAxe(a)}
            className={'chip' + (axe === a ? ' on' : '')}
            style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid #ECE5DF', background: axe === a ? '#232326' : '#fff', color: axe === a ? '#fff' : '#6E6E73', fontWeight: 600, cursor: 'pointer' }}>
            {a ? a.replace('_', ' ') : 'Tous les axes'}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {filtrees.length === 0 && <div style={{ textAlign: 'center', color: '#6E6E73', padding: 50 }}>Aucune mesure ne correspond.</div>}
        {axes.map(a => {
          const ms = filtrees.filter(m => m.categorie === a)
          if (!ms.length) return null
          return (
            <div key={a}>
              <div style={{ margin: '30px 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>{a.replace('_', ' ')}</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[a]}</span>
              </div>
              {ms.map(m => (
                <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card" style={{ background: '#fff', border: '1px solid #ECE5DF', borderRadius: 13, padding: '15px 17px', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: '#EE6B3E', fontWeight: 600 }}>{m.rubrique}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, margin: '2px 0 7px' }}>{m.intitule}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                      <BadgeStatut avancement={m.avancementPublie} />
                      {m.referent && <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#fff', border: '1px solid #ECE5DF' }}>{m.referent}</span>}
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#FAF7F4', border: '1px solid #ECE5DF', color: '#6E6E73' }}>Coût : {m.ordreGrandeur}</span>
                    </div>
                    <Barre pourcent={m.avancementPublie} />
                  </div>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Page mesures (Server Component → passe les données au client)**

Create `src/app/mesures/page.tsx`:
```tsx
import { toutesLesMesures } from '@/lib/requetes'
import { EnTete } from '@/components/EnTete'
import { ListeMesures, MesureVue } from '@/components/ListeMesures'

export default async function PageMesures() {
  const mesures = await toutesLesMesures()
  const vues: MesureVue[] = mesures.map(m => ({
    id: m.id, categorie: m.categorie, rubrique: m.rubrique, intitule: m.intitule,
    avancementPublie: m.avancementPublie,
    referent: m.eluReferent?.nom ?? null,
    natureCout: m.natureCout, ordreGrandeur: m.ordreGrandeur,
  }))
  const referents = [...new Set(vues.map(v => v.referent).filter(Boolean) as string[])].sort()
  return (
    <>
      <EnTete titre="Les engagements" sousTitre="Détail par axe, filtrable." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <ListeMesures mesures={vues} referents={referents} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Tester**

Run: `npm run dev`, aller sur `/mesures`, vérifier filtres (axe, référent, statut, recherche) et groupement par axe.

- [ ] **Step 4: Commit**

```bash
git add src/app/mesures/page.tsx src/components/ListeMesures.tsx
git commit -m "feat: measures list page with filters grouped by axis"
```

### Task 6.5 : Vue publique (lecture seule, données publiées)

**Files:**
- Create: `src/app/public/page.tsx`

- [ ] **Step 1: Page publique**

Create `src/app/public/page.tsx` : réutilise EnTete + synthèse (jauge globale + axes) + liste en lecture seule. **N'affiche jamais** propositions en attente ni journal. Coûts/limites masqués sauf si `coutPublic`/`limitesPublic`. Pied de page avec mentions légales + politique données (RGPD §8.6).

```tsx
import { toutesLesMesures, moyenne, agregatsParAxe } from '@/lib/requetes'
import { Jauge } from '@/components/Jauge'
import { Barre } from '@/components/Barre'
import { EnTete } from '@/components/EnTete'
import { BadgeStatut } from '@/components/BadgeStatut'
import { NOMS_AXES } from '@/lib/axes'

export default async function VuePublique() {
  const mesures = await toutesLesMesures()
  const global = moyenne(mesures.map(m => m.avancementPublie))
  const axes = agregatsParAxe(mesures)
  return (
    <>
      <EnTete titre="Suivi du programme municipal 2026-2032"
        sousTitre="Là où nous en sommes, engagement par engagement. Vue publique." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <section style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div className="panel" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <Jauge pourcent={global} />
            <div>
              <h2>Avancement global du programme</h2>
              <div style={{ fontSize: 13, color: '#6E6E73' }}>{mesures.length} engagements suivis</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 18 }}>
            {axes.map(a => (
              <div key={a.axe} className="panel">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#EE6B3E' }}>{a.axe.replace('_', ' ')}</div>
                <div style={{ fontSize: 13, fontWeight: 600, margin: '4px 0 8px', minHeight: 34 }}>{NOMS_AXES[a.axe]}</div>
                <div style={{ fontSize: 21, fontWeight: 800, marginBottom: 6 }}>{a.pourcent}%</div>
                <Barre pourcent={a.pourcent} />
              </div>
            ))}
          </div>
        </section>

        {['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4'].map(a => {
          const ms = mesures.filter(m => m.categorie === a)
          return (
            <div key={a}>
              <div style={{ margin: '30px 0 12px', display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>{a.replace('_', ' ')}</span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[a]}</span>
              </div>
              {ms.map(m => (
                <div key={m.id} className="card" style={{ background: '#fff', border: '1px solid #ECE5DF', borderRadius: 13, padding: '15px 17px', marginBottom: 10 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 7 }}>{m.intitule}</div>
                  <div style={{ marginBottom: 8 }}><BadgeStatut avancement={m.avancementPublie} /></div>
                  <Barre pourcent={m.avancementPublie} />
                </div>
              ))}
            </div>
          )
        })}

        <footer style={{ marginTop: 40, fontSize: 12, color: '#6E6E73', borderTop: '1px solid #ECE5DF', paddingTop: 16 }}>
          Seyssins Nature &amp; Solidaire — outil du groupe politique, indépendant des moyens municipaux.
          Données publiées et validées uniquement. Mentions légales et politique de protection des données disponibles sur demande.
        </footer>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Tester (sans connexion)**

Run: `npm run dev`, en navigation privée aller sur `/public` → accessible sans login, lecture seule, pas de curseurs ni journal.

- [ ] **Step 3: Commit**

```bash
git add src/app/public/page.tsx
git commit -m "feat: public read-only view (published data only, RGPD footer)"
```

---

## Phase 7 — Fiche mesure + proposition (élu) + journal

### Task 7.1 : API création de proposition

**Files:**
- Create: `src/app/api/propositions/route.ts`

- [ ] **Step 1: Route POST proposition**

Create `src/app/api/propositions/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutProposer(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { mesureId, avancementPropose, commentaire } = await req.json()
  const av = Math.max(0, Math.min(100, Math.round(Number(avancementPropose))))
  if (!mesureId || Number.isNaN(av)) {
    return NextResponse.json({ erreur: 'Données invalides' }, { status: 400 })
  }
  const prop = await prisma.proposition.create({
    data: {
      mesureId: Number(mesureId),
      auteurId: session.userId,
      avancementPropose: av,
      commentaire: commentaire ? String(commentaire) : null,
      statut: 'EN_ATTENTE',
    },
  })
  return NextResponse.json({ ok: true, id: prop.id })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/propositions/route.ts
git commit -m "feat: create proposition API (élu proposes, goes to pending)"
```

### Task 7.2 : API journal de bord

**Files:**
- Create: `src/app/api/journal/route.ts`

- [ ] **Step 1: Route POST journal**

Create `src/app/api/journal/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  const { mesureId, commentaire } = await req.json()
  if (!mesureId || !commentaire) {
    return NextResponse.json({ erreur: 'Données invalides' }, { status: 400 })
  }
  const e = await prisma.journalEntree.create({
    data: { mesureId: Number(mesureId), auteurId: session.userId, commentaire: String(commentaire) },
  })
  return NextResponse.json({ ok: true, id: e.id })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/journal/route.ts
git commit -m "feat: journal entry API"
```

### Task 7.3 : Fiche mesure + formulaire de proposition

**Files:**
- Create: `src/app/mesures/[id]/page.tsx`, `src/components/FormProposition.tsx`

- [ ] **Step 1: Formulaire de proposition (client)**

Create `src/components/FormProposition.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Barre } from './Barre'

export function FormProposition({ mesureId, avancementActuel }: { mesureId: number; avancementActuel: number }) {
  const [av, setAv] = useState(avancementActuel)
  const [commentaire, setCommentaire] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function envoyer() {
    setMsg('')
    const res = await fetch('/api/propositions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesureId, avancementPropose: av, commentaire }),
    })
    if (res.ok) { setMsg('Proposition envoyée. En attente de validation par l’administrateur.'); setCommentaire(''); router.refresh() }
    else setMsg((await res.json()).erreur ?? 'Erreur')
  }

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h2>Proposer une mise à jour</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span>Avancement proposé</span><b>{av}%</b>
      </div>
      <Barre pourcent={av} />
      <input type="range" min={0} max={100} step={5} value={av} onChange={e => setAv(+e.target.value)}
        style={{ width: '100%', accentColor: '#EE6B3E', marginTop: 8 }} aria-label="Avancement proposé" />
      <textarea placeholder="Commentaire (journal de bord)" value={commentaire} onChange={e => setCommentaire(e.target.value)}
        rows={3} style={{ width: '100%', marginTop: 10, padding: 10, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }} />
      <button onClick={envoyer} className="btn primary"
        style={{ marginTop: 10, padding: '10px 16px', background: '#EE6B3E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
        Envoyer la proposition
      </button>
      {msg && <div role="status" style={{ marginTop: 10, fontSize: 13, color: '#3A8540' }}>{msg}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Page fiche mesure (Server Component)**

Create `src/app/mesures/[id]/page.tsx`:
```tsx
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { FormProposition } from '@/components/FormProposition'
import { lireSession } from '@/lib/session'
import { peutProposer } from '@/lib/permissions'

export default async function FicheMesure({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const mesure = await prisma.mesure.findUnique({
    where: { id: Number(id) },
    include: {
      eluReferent: true, adjointRattachement: true,
      journalEntrees: { include: { auteur: true }, orderBy: { date: 'desc' } },
      historique: { orderBy: { date: 'asc' } },
    },
  })
  if (!mesure) notFound()
  const session = await lireSession()

  return (
    <>
      <EnTete titre={mesure.intitule} sousTitre={mesure.rubrique} />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        <div className="panel" style={{ marginTop: -34, position: 'relative', zIndex: 3 }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <BadgeStatut avancement={mesure.avancementPublie} />
            {mesure.eluReferent && <span style={{ fontSize: 12 }}>Référent : <b>{mesure.eluReferent.nom}</b></span>}
            {mesure.adjointRattachement && <span style={{ fontSize: 12, color: '#6E6E73' }}>sous {mesure.adjointRattachement.nom}</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Avancement publié</span><b>{mesure.avancementPublie}%</b>
          </div>
          <Barre pourcent={mesure.avancementPublie} />
          <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 10 }}>
            Coût : {mesure.natureCout} · {mesure.ordreGrandeur}
          </div>
        </div>

        {session && peutProposer(session.role) && (
          <FormProposition mesureId={mesure.id} avancementActuel={mesure.avancementPublie} />
        )}

        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Journal de bord</h2>
          {mesure.journalEntrees.length === 0 && <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune entrée.</div>}
          {mesure.journalEntrees.map(j => (
            <div key={j.id} style={{ borderBottom: '1px solid #ECE5DF', padding: '8px 0', fontSize: 13 }}>
              <b>{j.auteur.nom}</b> <span style={{ color: '#6E6E73' }}>· {j.date.toLocaleDateString('fr-FR')}</span>
              <div>{j.commentaire}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Tester**

Run: `npm run dev`, connecté comme élu, ouvrir une fiche mesure, proposer un avancement + commentaire → message "en attente de validation". Vérifier que l'avancement publié n'a PAS changé.

- [ ] **Step 4: Commit**

```bash
git add src/app/mesures/[id]/page.tsx src/components/FormProposition.tsx
git commit -m "feat: measure detail page with proposition form and journal"
```

---

## Phase 8 — Espace admin : file de validation

### Task 8.1 : API valider / refuser une proposition

**Files:**
- Create: `src/app/api/propositions/[id]/route.ts`

- [ ] **Step 1: Route PATCH (transaction : publie + historique)**

Create `src/app/api/propositions/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { calculerEffetValidation } from '@/lib/validation'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const { action, motifRefus } = await req.json() // action: 'valider' | 'refuser'

  const prop = await prisma.proposition.findUnique({ where: { id: Number(id) }, include: { mesure: true } })
  if (!prop || prop.statut !== 'EN_ATTENTE') {
    return NextResponse.json({ erreur: 'Proposition introuvable ou déjà traitée' }, { status: 404 })
  }

  if (action === 'valider') {
    const effet = calculerEffetValidation({
      avancementPublie: prop.mesure.avancementPublie,
      avancementPropose: prop.avancementPropose,
    })
    await prisma.$transaction([
      prisma.mesure.update({ where: { id: prop.mesureId }, data: { avancementPublie: effet.nouveauAvancementPublie } }),
      prisma.historique.create({
        data: {
          mesureId: prop.mesureId,
          ancienPourcent: effet.entreeHistorique.ancienPourcent,
          nouveauPourcent: effet.entreeHistorique.nouveauPourcent,
          proposeParId: prop.auteurId,
          valideeParId: session.userId,
        },
      }),
      prisma.proposition.update({
        where: { id: prop.id },
        data: { statut: 'VALIDEE', valideeParId: session.userId, traiteeLe: new Date() },
      }),
    ])
    return NextResponse.json({ ok: true })
  }

  if (action === 'refuser') {
    await prisma.proposition.update({
      where: { id: prop.id },
      data: { statut: 'REFUSEE', motifRefus: motifRefus ? String(motifRefus) : null, valideeParId: session.userId, traiteeLe: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ erreur: 'Action inconnue' }, { status: 400 })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/propositions/[id]/route.ts
git commit -m "feat: validate/refuse proposition API (atomic publish + history)"
```

### Task 8.2 : Page file de validation

**Files:**
- Create: `src/app/admin/validations/page.tsx`, `src/components/FileValidation.tsx`

- [ ] **Step 1: Composant client de la file**

Create `src/components/FileValidation.tsx`:
```tsx
'use client'
import { useRouter } from 'next/navigation'

export type PropVue = {
  id: number; mesureIntitule: string; auteur: string
  ancien: number; propose: number; commentaire: string | null
}

export function FileValidation({ propositions }: { propositions: PropVue[] }) {
  const router = useRouter()
  async function traiter(id: number, action: 'valider' | 'refuser') {
    let motifRefus: string | null = null
    if (action === 'refuser') motifRefus = prompt('Motif du refus (optionnel) :') || null
    const res = await fetch(`/api/propositions/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, motifRefus }),
    })
    if (res.ok) router.refresh()
    else alert((await res.json()).erreur ?? 'Erreur')
  }
  if (!propositions.length) return <div style={{ color: '#6E6E73', padding: 40, textAlign: 'center' }}>Aucune proposition en attente.</div>
  return (
    <div>
      {propositions.map(p => (
        <div key={p.id} className="card" style={{ background: '#fff', border: '1px solid #ECE5DF', borderRadius: 13, padding: '15px 17px', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.mesureIntitule}</div>
          <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 6 }}>
            Proposé par <b>{p.auteur}</b> : {p.ancien}% → <b style={{ color: '#EE6B3E' }}>{p.propose}%</b>
          </div>
          {p.commentaire && <div style={{ fontSize: 13, marginBottom: 8 }}>« {p.commentaire} »</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => traiter(p.id, 'valider')} style={{ padding: '8px 14px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Valider</button>
            <button onClick={() => traiter(p.id, 'refuser')} style={{ padding: '8px 14px', background: '#fff', color: '#CD5026', border: '1px solid #CD5026', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Refuser</button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Page (Server Component, re-vérifie le rôle ADMIN)**

Create `src/app/admin/validations/page.tsx`:
```tsx
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { FileValidation, PropVue } from '@/components/FileValidation'

export default async function PageValidations() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  const props = await prisma.proposition.findMany({
    where: { statut: 'EN_ATTENTE' },
    include: { mesure: true, auteur: true },
    orderBy: { creeeLe: 'asc' },
  })
  const vues: PropVue[] = props.map(p => ({
    id: p.id, mesureIntitule: p.mesure.intitule, auteur: p.auteur.nom,
    ancien: p.mesure.avancementPublie, propose: p.avancementPropose, commentaire: p.commentaire,
  }))

  return (
    <>
      <EnTete titre="Propositions à valider" sousTitre={`${vues.length} en attente`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <FileValidation propositions={vues} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Tester le cycle complet**

Run: `npm run dev`. (1) Élu propose un avancement sur une mesure. (2) Admin va sur `/admin/validations`, voit la proposition, clique Valider. (3) Vérifier : l'avancement publié de la mesure a changé, une entrée d'historique existe (`npm run db:studio`), la proposition passe à VALIDEE.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/validations/page.tsx src/components/FileValidation.tsx
git commit -m "feat: admin validation queue (validate/refuse propositions)"
```

---

## Phase 9 — Navigation + vue par élu + comptes/mesures admin

### Task 9.1 : Barre de navigation selon le rôle

**Files:**
- Create: `src/components/Nav.tsx`, modify `src/app/layout.tsx`

- [ ] **Step 1: Lecture de session côté layout + Nav**

Create `src/components/Nav.tsx`:
```tsx
import Link from 'next/link'
import { lireSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { peutValider } from '@/lib/permissions'

export async function Nav() {
  const session = await lireSession()
  if (!session) return null
  const nbAttente = peutValider(session.role)
    ? await prisma.proposition.count({ where: { statut: 'EN_ATTENTE' } })
    : 0
  return (
    <nav style={{ display: 'flex', gap: 16, padding: '12px 22px', borderBottom: '1px solid #ECE5DF', alignItems: 'center', fontSize: 14 }}>
      <Link href="/">Tableau de bord</Link>
      <Link href="/mesures">Engagements</Link>
      <Link href="/par-elu">Par élu</Link>
      {peutValider(session.role) && (
        <Link href="/admin/validations" style={{ fontWeight: 600 }}>
          À valider{nbAttente > 0 && <span style={{ marginLeft: 6, background: '#EE6B3E', color: '#fff', borderRadius: 10, padding: '1px 8px', fontSize: 12 }}>{nbAttente}</span>}
        </Link>
      )}
      {peutValider(session.role) && <Link href="/admin/mesures">Gérer mesures</Link>}
      {peutValider(session.role) && <Link href="/admin/comptes">Comptes</Link>}
      <form action="/api/auth/logout" method="post" style={{ marginLeft: 'auto' }}>
        <button type="submit" style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer' }}>Déconnexion</button>
      </form>
    </nav>
  )
}
```

> Note : le logout via `<form method=post>` appellera l'API. Vérifier que la route logout redirige ou que le client recharge. Si nécessaire, adapter logout pour renvoyer une redirection 303 vers `/connexion`.

- [ ] **Step 2: Intégrer la Nav dans le layout**

Modify `src/app/layout.tsx` : importer `Nav` et l'afficher au-dessus de `{children}`. Garder `import './globals.css'`. Comme `Nav` est async (Server Component), le layout peut rester async.

```tsx
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata = { title: 'Suivi du programme — SNS' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        {/* @ts-expect-error Async Server Component */}
        <Nav />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Ajuster logout pour rediriger**

Modify `src/app/api/auth/logout/route.ts` pour rediriger après déconnexion :
```ts
import { NextResponse } from 'next/server'
import { detruireSession } from '@/lib/session'

export async function POST(req: Request) {
  await detruireSession()
  return NextResponse.redirect(new URL('/connexion', req.url), 303)
}
```

- [ ] **Step 4: Tester**

Run: `npm run dev`. Connecté admin → voit "À valider (n)", "Gérer mesures", "Comptes". Connecté élu → ne voit que Tableau de bord / Engagements / Par élu. Déconnexion fonctionne.

- [ ] **Step 5: Commit**

```bash
git add src/components/Nav.tsx src/app/layout.tsx src/app/api/auth/logout/route.ts
git commit -m "feat: role-aware navigation with pending-count badge + logout redirect"
```

### Task 9.2 : Vue par élu

**Files:**
- Create: `src/app/par-elu/page.tsx`

- [ ] **Step 1: Page**

Create `src/app/par-elu/page.tsx`:
```tsx
import { toutesLesMesures, moyenne } from '@/lib/requetes'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import Link from 'next/link'

export default async function ParElu() {
  const mesures = await toutesLesMesures()
  const groupes = new Map<string, typeof mesures>()
  for (const m of mesures) {
    const nom = m.eluReferent?.nom ?? 'Sans référent'
    if (!groupes.has(nom)) groupes.set(nom, [])
    groupes.get(nom)!.push(m)
  }
  const tries = [...groupes.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  return (
    <>
      <EnTete titre="Suivi par élu" sousTitre="Ce que chaque référent porte et où il en est." />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        {tries.map(([nom, ms]) => (
          <div key={nom} className="panel" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h2 style={{ textTransform: 'none', fontSize: 16, color: '#232326' }}>{nom}</h2>
              <span style={{ fontSize: 13, color: '#6E6E73' }}>{moyenne(ms.map(m => m.avancementPublie))}% · {ms.length} mesures</span>
            </div>
            <div style={{ marginTop: 10 }}>
              {ms.map(m => (
                <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #ECE5DF' }}>
                    <BadgeStatut avancement={m.avancementPublie} />
                    <span style={{ flex: 1, fontSize: 13 }}>{m.intitule}</span>
                    <span style={{ width: 120 }}><Barre pourcent={m.avancementPublie} /></span>
                    <b style={{ fontSize: 13, width: 40, textAlign: 'right' }}>{m.avancementPublie}%</b>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Tester + commit**

Run: `npm run dev`, aller sur `/par-elu`. Puis :
```bash
git add src/app/par-elu/page.tsx
git commit -m "feat: per-élu view grouped by referent"
```

### Task 9.3 : Admin — gestion des comptes

**Files:**
- Create: `src/app/admin/comptes/page.tsx`, `src/app/api/comptes/route.ts`

- [ ] **Step 1: API création/désactivation de compte**

Create `src/app/api/comptes/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { hashMotDePasse } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { nom, email, role, motDePasse } = await req.json()
  if (!nom || !email || !motDePasse) {
    return NextResponse.json({ erreur: 'Champs requis' }, { status: 400 })
  }
  const hash = await hashMotDePasse(String(motDePasse))
  const u = await prisma.user.create({
    data: { nom: String(nom), email: String(email).toLowerCase(), role: role === 'ADMIN' ? 'ADMIN' : 'ELU', motDePasseHash: hash },
  })
  return NextResponse.json({ ok: true, id: u.id })
}

export async function PATCH(req: NextRequest) {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id, actif } = await req.json()
  await prisma.user.update({ where: { id: Number(id) }, data: { actif: Boolean(actif) } })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Page liste + formulaire**

Create `src/app/admin/comptes/page.tsx` (Server Component re-vérifie ADMIN, liste les comptes, formulaire client simple d'ajout). Liste : nom, email, rôle, actif. Réutiliser le pattern client de FileValidation pour les actions (fetch + router.refresh()). Le code complet suit le même style que Task 8.2 ; afficher pour chaque user un bouton Activer/Désactiver appelant `PATCH /api/comptes`.

```tsx
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererComptes } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { GestionComptes } from '@/components/GestionComptes'

export default async function PageComptes() {
  const session = await lireSession()
  if (!session || !peutGererComptes(session.role)) redirect('/')
  const users = await prisma.user.findMany({ orderBy: { nom: 'asc' } })
  const vues = users.map(u => ({ id: u.id, nom: u.nom, email: u.email, role: u.role, actif: u.actif }))
  return (
    <>
      <EnTete titre="Comptes" sousTitre={`${vues.length} comptes`} />
      <div style={{ maxWidth: 880, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <GestionComptes comptes={vues} />
      </div>
    </>
  )
}
```

- [ ] **Step 3: Composant client GestionComptes**

Create `src/components/GestionComptes.tsx`:
```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CompteVue = { id: number; nom: string; email: string; role: string; actif: boolean }

export function GestionComptes({ comptes }: { comptes: CompteVue[] }) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [role, setRole] = useState('ELU')

  async function ajouter() {
    const res = await fetch('/api/comptes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nom, email, motDePasse, role }),
    })
    if (res.ok) { setNom(''); setEmail(''); setMotDePasse(''); router.refresh() }
    else alert((await res.json()).erreur ?? 'Erreur')
  }
  async function basculer(id: number, actif: boolean) {
    const res = await fetch('/api/comptes', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actif: !actif }),
    })
    if (res.ok) router.refresh()
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 18 }}>
        <h2>Ajouter un compte</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} style={{ padding: 10, border: '1px solid #ECE5DF', borderRadius: 8 }} />
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={{ padding: 10, border: '1px solid #ECE5DF', borderRadius: 8 }} />
          <input placeholder="Mot de passe temporaire" value={motDePasse} onChange={e => setMotDePasse(e.target.value)} style={{ padding: 10, border: '1px solid #ECE5DF', borderRadius: 8 }} />
          <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: 10, border: '1px solid #ECE5DF', borderRadius: 8 }}>
            <option value="ELU">Élu</option><option value="ADMIN">Admin</option>
          </select>
          <button onClick={ajouter} style={{ padding: '10px 16px', background: '#EE6B3E', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>Ajouter</button>
        </div>
      </div>
      <div className="panel">
        <h2>Comptes existants</h2>
        {comptes.map(c => (
          <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #ECE5DF', fontSize: 13, opacity: c.actif ? 1 : .5 }}>
            <b style={{ flex: 1 }}>{c.nom}</b>
            <span style={{ color: '#6E6E73' }}>{c.email}</span>
            <span style={{ fontWeight: 600 }}>{c.role}</span>
            <button onClick={() => basculer(c.id, c.actif)} style={{ padding: '4px 10px', border: '1px solid #ECE5DF', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>
              {c.actif ? 'Désactiver' : 'Activer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Tester + commit**

Run: `npm run dev`, admin → /admin/comptes, ajouter un compte test, le désactiver.
```bash
git add src/app/admin/comptes/page.tsx src/app/api/comptes/route.ts src/components/GestionComptes.tsx
git commit -m "feat: admin account management (create, enable/disable)"
```

### Task 9.4 : Admin — gestion des mesures (modifier)

**Files:**
- Create: `src/app/admin/mesures/page.tsx`, `src/app/api/mesures/[id]/route.ts`

- [ ] **Step 1: API modification d'une mesure**

Create `src/app/api/mesures/[id]/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) {
    return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const data: Record<string, unknown> = {}
  if (typeof body.intitule === 'string') data.intitule = body.intitule
  if (typeof body.eluReferentId === 'number') data.eluReferentId = body.eluReferentId
  if (typeof body.coutPublic === 'boolean') data.coutPublic = body.coutPublic
  if (typeof body.limitesPublic === 'boolean') data.limitesPublic = body.limitesPublic
  await prisma.mesure.update({ where: { id: Number(id) }, data })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Page admin mesures (liste + lien d'édition)**

Create `src/app/admin/mesures/page.tsx` : Server Component re-vérifie ADMIN, liste toutes les mesures avec leur référent et boutons pour basculer `coutPublic`/`limitesPublic` (réutilise un petit composant client analogue à GestionComptes). Pour le MVP : permettre de changer le référent (select des users) et basculer la visibilité publique des champs coût/limites. L'ajout/fusion/scission de mesures est noté comme évolution (bouton "Ajouter une mesure" créant une mesure HORS_PROGRAMME vide).

```tsx
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutGererMesures } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { NOMS_AXES } from '@/lib/axes'

export default async function AdminMesures() {
  const session = await lireSession()
  if (!session || !peutGererMesures(session.role)) redirect('/')
  const mesures = await prisma.mesure.findMany({ orderBy: { ordre: 'asc' }, include: { eluReferent: true } })
  return (
    <>
      <EnTete titre="Gérer les mesures" sousTitre={`${mesures.length} mesures`} />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        {mesures.map(m => (
          <div key={m.id} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #ECE5DF', fontSize: 13 }}>
            <span style={{ width: 70, color: '#EE6B3E', fontWeight: 600 }}>{m.categorie.replace('_', ' ')}</span>
            <span style={{ flex: 1 }}>{m.intitule}</span>
            <span style={{ color: '#6E6E73', width: 160 }}>{m.eluReferent?.nom ?? '—'}</span>
            <span style={{ width: 50, textAlign: 'right' }}>{m.avancementPublie}%</span>
          </div>
        ))}
        <p style={{ color: '#6E6E73', fontSize: 12, marginTop: 16 }}>
          Édition fine (changer référent, visibilité publique des champs, ajout/fusion) : à enrichir en phase 2 via l’API PATCH /api/mesures/[id].
        </p>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Tester + commit**

Run: `npm run dev`, admin → /admin/mesures, voir la liste des 67 mesures avec référents.
```bash
git add src/app/admin/mesures/page.tsx src/app/api/mesures/[id]/route.ts
git commit -m "feat: admin measures list + measure update API"
```

---

## Phase 10 — Exports + courbes + finitions

### Task 10.1 : Bouton Imprimer / PDF + CSS print

**Files:**
- Modify: `src/app/globals.css`, create `src/components/BoutonImpression.tsx`

- [ ] **Step 1: Bouton impression (client)**

Create `src/components/BoutonImpression.tsx`:
```tsx
'use client'
export function BoutonImpression() {
  return (
    <button onClick={() => window.print()} className="no-print"
      style={{ padding: '10px 14px', background: '#EE6B3E', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer' }}>
      Imprimer / PDF
    </button>
  )
}
```

- [ ] **Step 2: CSS print (charte conservée)**

Ajouter à la fin de `src/app/globals.css`:
```css
@media print {
  nav, .no-print, input[type=range], .chip, button { display: none !important; }
  header { background: #EE6B3E !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .card, .panel, .bar i, .badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

- [ ] **Step 3: Placer le bouton sur le tableau de bord**

Modify `src/app/page.tsx` : importer et afficher `<BoutonImpression />` en haut de la zone de contenu.

- [ ] **Step 4: Tester + commit**

Run: `npm run dev`, tableau de bord, cliquer Imprimer → aperçu PDF à la charte sans la nav.
```bash
git add src/components/BoutonImpression.tsx src/app/globals.css src/app/page.tsx
git commit -m "feat: print/PDF button with brand-preserving print CSS"
```

### Task 10.2 : Export CSV des mesures

**Files:**
- Create: `src/app/api/export/csv/route.ts`

- [ ] **Step 1: Route CSV**

Create `src/app/api/export/csv/route.ts`:
```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { NOMS_AXES } from '@/lib/axes'
import { statutDe } from '@/lib/statut'

function champ(v: unknown): string {
  const s = String(v ?? '')
  return `"${s.replace(/"/g, '""')}"`
}

export async function GET() {
  const session = await lireSession()
  if (!session) return NextResponse.json({ erreur: 'Non autorisé' }, { status: 401 })
  const mesures = await prisma.mesure.findMany({ orderBy: { ordre: 'asc' }, include: { eluReferent: true } })
  const entete = ['Axe', 'Rubrique', 'Intitulé', 'Référent', 'Coût', 'Ordre de grandeur', 'Avancement', 'Statut']
  const lignes = mesures.map(m => [
    NOMS_AXES[m.categorie], m.rubrique, m.intitule, m.eluReferent?.nom ?? '',
    m.natureCout ?? '', m.ordreGrandeur ?? '', `${m.avancementPublie}%`, statutDe(m.avancementPublie).nom,
  ].map(champ).join(','))
  const csv = '﻿' + [entete.map(champ).join(','), ...lignes].join('\n')
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="suivi-sns.csv"',
    },
  })
}
```

- [ ] **Step 2: Lien d'export dans la nav ou le tableau de bord**

Ajouter dans `src/app/page.tsx` un lien : `<a href="/api/export/csv" className="no-print">Export CSV</a>`.

- [ ] **Step 3: Tester + commit**

Run: `npm run dev`, cliquer Export CSV → fichier téléchargé, ouvrable dans Excel (BOM UTF-8 → accents corrects).
```bash
git add src/app/api/export/csv/route.ts src/app/page.tsx
git commit -m "feat: CSV export of measures (UTF-8 BOM for Excel)"
```

### Task 10.3 : Courbe d'évolution (historique)

**Files:**
- Create: `src/components/CourbeEvolution.tsx`, modify `src/app/page.tsx`

- [ ] **Step 1: Composant courbe SVG (sans dépendance)**

Create `src/components/CourbeEvolution.tsx`:
```tsx
export type PointEvolution = { date: string; pourcent: number }

export function CourbeEvolution({ points }: { points: PointEvolution[] }) {
  if (points.length < 2) {
    return <div style={{ color: '#6E6E73', fontSize: 13 }}>Pas encore assez d’historique pour tracer une courbe.</div>
  }
  const w = 600, h = 160, pad = 24
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1))
  const ys = points.map(p => h - pad - (Math.max(0, Math.min(100, p.pourcent)) / 100) * (h - 2 * pad))
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Évolution de l’avancement global">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#ECE5DF" />
      <path d={d} fill="none" stroke="#EE6B3E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="3" fill="#EE6B3E" />)}
    </svg>
  )
}
```

- [ ] **Step 2: Calcul des points depuis l'historique + affichage**

Modify `src/app/page.tsx` : après les agrégats, charger l'historique global et construire des points cumulés. Pour le MVP, série simple = moyenne d'avancement après chaque validation (approché par l'évolution des `nouveauPourcent` dans le temps). Ajouter un panel "Évolution" avec `<CourbeEvolution points={points} />`.

```tsx
// dans page.tsx, ajouter :
import { prisma } from '@/lib/db'
import { CourbeEvolution, PointEvolution } from '@/components/CourbeEvolution'
// ...
const histo = await prisma.historique.findMany({ orderBy: { date: 'asc' } })
const points: PointEvolution[] = histo.map(h => ({
  date: h.date.toISOString().slice(0, 10),
  pourcent: h.nouveauPourcent,
}))
// ... puis dans le JSX, un panel :
// <div className="panel" style={{ marginTop: 18 }}><h2>Évolution</h2><CourbeEvolution points={points} /></div>
```

- [ ] **Step 3: Tester + commit**

Run: `npm run dev`, valider 2-3 propositions, recharger le tableau de bord → la courbe apparaît.
```bash
git add src/components/CourbeEvolution.tsx src/app/page.tsx
git commit -m "feat: evolution curve from validation history"
```

---

## Phase 11 — Documentation + déploiement Railway

### Task 11.1 : README + doc utilisateur

**Files:**
- Create: `README.md`, `docs/guide-utilisateur.md`

- [ ] **Step 1: README de déploiement**

Create `README.md` : présentation, prérequis (Node 20+), installation (`npm install`), variables d'env (copier `.env.example`), migration (`npm run db:deploy`), seed (`npm run db:seed`), démarrage (`npm run dev`). **Section déploiement Railway** :
1. Pousser le repo sur GitHub.
2. Railway → New Project → Deploy from GitHub repo.
3. Ajouter le service PostgreSQL (déjà créé).
4. Variables : `DATABASE_URL` (référence au service Postgres), `SESSION_SECRET`, `SEED_PASSWORD`.
5. Build command : `npm run build`. Start command : `npm run db:deploy && npm start`.
6. **Le seed ne s'exécute pas au déploiement** (lancer `npm run db:seed` une seule fois manuellement après le 1er déploiement).
7. **Garantie zéro perte** : `db:deploy` applique seulement les migrations additives ; jamais de reset.

- [ ] **Step 2: Guide utilisateur 1 page**

Create `docs/guide-utilisateur.md` : comment se connecter, comment un élu propose une mise à jour (fiche mesure → curseur → commentaire → envoyer), comment l'admin valide (onglet À valider → Valider/Refuser), rappel que rien n'est public avant validation.

- [ ] **Step 3: Commit**

```bash
git add README.md docs/guide-utilisateur.md
git commit -m "docs: deployment README (Railway) + 1-page user guide"
```

### Task 11.2 : Garde-fous anti-perte de données

**Files:**
- Create: `docs/sauvegarde.md`

- [ ] **Step 1: Documenter sauvegarde + interdits**

Create `docs/sauvegarde.md` :
- Commande d'export manuel : `pg_dump "$DATABASE_URL" > sauvegarde-$(date +%F).sql`
- Liste des commandes INTERDITES en prod : `prisma migrate reset`, `prisma db push --force-reset`, tout DROP manuel.
- Rappel : `Historique` est append-only ; ne jamais le modifier.
- Backups Railway automatiques selon le plan ; recommander un export `pg_dump` mensuel.

- [ ] **Step 2: Vérifier qu'aucun script destructif n'existe**

Run: `grep -rn "migrate reset\|force-reset\|DROP TABLE" package.json prisma/ src/ || echo "Aucun script destructif trouvé"`
Expected: "Aucun script destructif trouvé".

- [ ] **Step 3: Commit**

```bash
git add docs/sauvegarde.md
git commit -m "docs: backup procedure and forbidden destructive commands"
```

### Task 11.3 : Vérification finale globale

- [ ] **Step 1: Tous les tests passent**

Run: `npm test`
Expected: tous les fichiers de test PASS (statut, auth, permissions, validation).

- [ ] **Step 2: Build de production**

Run: `npm run build`
Expected: build réussi, aucune erreur TypeScript.

- [ ] **Step 3: Parcours complet manuel**

Run: `npm run dev`. Vérifier dans l'ordre :
1. `/public` accessible sans login (lecture seule).
2. Connexion admin → tableau de bord + 4 axes + courbe.
3. Connexion élu (autre compte) → proposer un avancement.
4. Admin → À valider → valider → l'avancement publié change + historique créé.
5. Export CSV ouvert dans Excel.
6. Re-lancer `npm run db:seed` → "Seed ignoré" (idempotence confirmée).

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore: final verification pass (tests, build, e2e walkthrough)"
```

---

## Couverture du cahier des charges (auto-revue)

| Exigence | Tâche(s) |
|---|---|
| 2 rôles (admin/élu) §3 | 2.3, 5.x, 9.1 |
| Vue publique lecture seule §3, §5.6 | 6.5 |
| 67 mesures + 4 axes §4.1 | 3.2 (décompte vérifié) |
| Catégorie « Hors programme » §4.1 | schéma 1.1 + admin 9.4 |
| Modèle de données §4.2 | 1.1 |
| Binôme élu/adjoint §4.3 | 3.1 (adjointKey) + 1.1 + 7.3 |
| Proposition sans écraser §5.1 | 7.1, 7.3 |
| Workflow Brouillon→À valider→Publié §5.2 | 8.1, 8.2 |
| Synthèse (jauges) §5.3 | 6.3 |
| Détail + filtres §5.4 | 6.4 |
| Vue par élu §5.4 | 9.2 |
| Compteur « à valider » §5.5 | 9.1 |
| Export PDF §5.6 | 10.1 |
| Export CSV §5.6 | 10.2 |
| Courbes d'évolution §5.6 | 10.3 |
| Gratuit/robuste §6.1 | stack (Railway free) |
| Charte SNS §7 | 4.1, 4.2, 6.2 |
| Séparation politique/public §8.1, §8.4 | 6.5 (publié only) + champs *Public |
| Validation admin obligatoire §8.3 | 8.1 (rien public sans validation) |
| Historique inaltérable §8.5 | 1.1 (append-only) + 8.1 |
| RGPD §8.6 | 6.5 (footer) + 11.1 |
| Sécurité/RLS §8.7 | 2.2, 2.4, 5.3, perms côté serveur |
| Import initial §6.3, §10.3 | 3.3 |
| Comptes initiaux §10.4 | 3.1, 3.3 |
| Doc utilisateur §10.5 | 11.1 |
| **Zéro perte au redéploiement (exigence commanditaire)** | 1.1, 3.3, 11.1, 11.2 |

**Reporté en phase 2 (bonus §9)** : emails récap hebdo (cron), vue par quartier, mode présentation, multi-projets, PDF serveur Playwright, upload photos (API pièces jointes prévue au schéma mais UI d'upload non incluse dans le MVP).

---

*Plan généré le 29 juin 2026 à partir de la spec validée. TDD sur la logique critique, commits fréquents, migrations additives uniquement.*
