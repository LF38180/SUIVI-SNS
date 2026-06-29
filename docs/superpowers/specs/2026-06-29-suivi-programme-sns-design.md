# Conception — Application de suivi du programme SNS 2026-2032

**Projet :** application web de suivi des engagements « Seyssins Nature & Solidaire »
**Commanditaire :** Loïck Ferrucci (3ᵉ adjoint, président du groupe SNS)
**Date :** 29 juin 2026
**Source :** `Cahier_des_Charges_Tableau_de_Bord_SNS_V2_29_JUIN_2026.md` + prototype HTML

---

## 0. Décisions de cadrage

| Sujet | Décision |
|---|---|
| Périmètre initial | Application MVP complète (auth, rôles, 67 mesures, circuit de validation, vue publique) |
| Base de données | **Postgres sur Railway dès maintenant** (app en local, base sur Railway) |
| Déploiement final | Railway (1 service web + 1 base Postgres) |
| Authentification | Email + mot de passe (sessions cookie, bcrypt) |
| Comptes admin | Loïck Ferrucci + Julie De Breza (directrice de cabinet, suppléante admin) |
| Emails | Tous `@mairie-seyssins.fr` (institutionnels). **Réserve §8.1** : séparation politique/mairie ; usage assumé par le commanditaire. |
| Mots de passe | Temporaire commun à l'import, à changer à la 1re connexion |

### Comptes initiaux (seed)

**Admin (2)**
- Loïck Ferrucci — `loick.ferrucci@mairie-seyssins.fr` — adjoint Moyens généraux
- Julie De Breza — `julie.debreza@mairie-seyssins.fr` — directrice de cabinet (suppléante)

**Élus contributeurs (20)** — rôle `ELU`
- Fabrice Hugelé — `fabrice.hugele@mairie-seyssins.fr` — Maire
- Jean-Marc Paucod — `jean-marc.paucod@mairie-seyssins.fr` — 1ᵉʳ adjoint, Éducation
- Isabelle Baudin — `isabelle.baudin@mairie-seyssins.fr` — 2ᵉ adjointe, Environnement
- Anne-Marie Lombard — `anne-marie.lombard@mairie-seyssins.fr` — 4ᵉ adjointe, Citoyenneté
- Sylvain Cialdella — `sylvain.cialdella@mairie-seyssins.fr` — 5ᵉ adjoint, Affaires sociales
- Carole Viton — `carole.viton@mairie-seyssins.fr` — 6ᵉ adjointe, Vie éco/Sport
- Emmanuel Courraud — `emmanuel.courraud@mairie-seyssins.fr` — 7ᵉ adjoint, Urbanisme/Mobilités
- Rachel Rouillon — `rachel.rouillon@mairie-seyssins.fr` — 8ᵉ adjointe, Culture
- Marie Garrigos-Leclerc — `marie.garrigos-leclerc@mairie-seyssins.fr` — déléguée (sous Loïck)
- Pierre Chevrier — `pierre.chevrier@mairie-seyssins.fr` — délégué (sous Loïck)
- Cyril Jacquier — `cyril.jacquier@mairie-seyssins.fr` — délégué (sous Isabelle Baudin)
- Mathieu Cianci — `mathieu.cianci@mairie-seyssins.fr` — délégué (sous Jean-Marc Paucod)
- Françoise Collot — `francoise.collot@mairie-seyssins.fr` — déléguée (sous Sylvain Cialdella)
- Delphine Gresil — `delphine.gresil@mairie-seyssins.fr` — déléguée (sous Sylvain Cialdella)
- Sylvain Bugier — `sylvain.bugier@mairie-seyssins.fr` — délégué (rattachement à préciser)
- Jihène Shaiek — `jihene.shaiek@mairie-seyssins.fr` — déléguée (sous Rachel Rouillon)
- Pascal Faucher — `pascal.faucher@mairie-seyssins.fr` — délégué (rattachement à préciser)
- Célia Borré — `celia.borre@mairie-seyssins.fr` — référente, Accessibilité
- François Gilabert — `francois.gilabert@mairie-seyssins.fr` — référent, Laïcité
- Ilona Ivars — `ilona.ivars@mairie-seyssins.fr` — référente, Partenariats sportifs

**Total : 22 comptes** (2 admin + 20 élus).

---

## 1. Architecture & rôles

**Une seule application Next.js** (App Router) : interface + API dans le même projet via Route Handlers. Pas de serveur séparé. Sur Railway : 1 service web + 1 base Postgres (services distincts).

**3 niveaux d'accès :**

| Qui | Accès | Voit |
|---|---|---|
| Visiteur public (non connecté) | Lecture seule, `/public` | Données **publiées** uniquement. Jamais propositions en attente ni journal interne |
| Élu contributeur (connecté) | Voit tout, propose des mises à jour | Tout le programme. Propose sur n'importe quelle mesure |
| Admin (Loïck + suppléant) | Tout pouvoir | Valide/refuse, gère mesures et comptes, publie |

**Circuit de validation (cœur du système) :**
- Chaque mesure : `avancementPublie` (officiel, affiché partout) + propositions en attente (invisibles au public).
- Élu propose → n'écrase pas le publié, entre dans la file « à valider ».
- Admin valide → la valeur proposée devient publiée **+** une entrée d'`Historique` datée et signée (inaltérable → courbes d'évolution).
- Admin refuse → motif optionnel, le publié ne bouge pas.

Workflow : **Brouillon → À valider → Publié** (§5.2 du cahier).

---

## 2. Modèle de données (Prisma / Postgres)

**`User`** (élus)
- `id`, `nom`, `email` (unique), `motDePasseHash`, `role` (`ADMIN` | `ELU`), `actif`

**`Mesure`** (67 + initiatives hors programme)
- `id`, `categorie` (`AXE_1`..`AXE_4` | `HORS_PROGRAMME`), `rubrique`, `intitule`
- `eluReferentId` → User, `adjointRattachementId` → User (nullable, binôme §4.3)
- `natureCout`, `ordreGrandeur`, `besoins`, `limites`, `echeanceCible`
- `avancementPublie` (0-100) ; `statut` **dérivé** (non stocké)
- champs `*Public` (bool) : l'admin choisit champ par champ ce qui est public (§8.4)
- `ordre` (tri stable dans un axe)

**`Proposition`** (file « à valider »)
- `id`, `mesureId`, `auteurId`, `avancementPropose`, `commentaire`, `echeanceProposee`
- `statut` (`EN_ATTENTE` | `VALIDEE` | `REFUSEE`), `motifRefus`, `valideeParId`, `creeeLe`, `traiteeLe`
- *Choix : table séparée (pas un simple champ) → plusieurs propositions possibles, traçabilité complète, robuste sur 6 ans.*

**`JournalEntree`** (1 mesure → N)
- `id`, `mesureId`, `auteurId`, `date`, `commentaire`, `avancementAssocie`

**`PieceJointe`** (1 mesure → N)
- `id`, `mesureId`, `type` (`PHOTO` | `DOCUMENT` | `LIEN`), `url`, `legende`, `ajouteeParId`, `date`

**`Historique`** (inaltérable, append-only — 1 ligne par validation)
- `id`, `mesureId`, `ancienPourcent`, `nouveauPourcent`, `proposeParId`, `valideeParId`, `date`

**Statut dérivé** (calculé partout, jamais stocké) :
`0` = Non démarré · `1-33` = Engagé · `34-99` = En cours · `100` = Réalisé.

---

## 2bis. Persistance — ZÉRO perte de données au redéploiement (IMPÉRATIF)

**Règle absolue : code et données séparés. Redéployer = remplacer le code, jamais toucher la base.**

1. **Base Postgres = service Railway séparé**, volume persistant propre. Redéployer l'app ne redémarre pas la base.
2. **Migrations Prisma additives uniquement.** Déploiement = `prisma migrate deploy`. Jamais `migrate reset`, jamais `db push --force`. Toute migration destructive interdite sauf décision manuelle explicite.
3. **Seed idempotent et protégé** : `if (count > 0) skip`. L'import des 67 mesures tourne **une seule fois**, jamais au redéploiement. N'écrase jamais les avancements saisis.
4. **`Historique` append-only** : aucun UPDATE/DELETE dans le code (inaltérabilité §8.5).
5. **Garde-fous** : aucun script de déploiement ne vide la base ; pas de commande destructive dans `package.json` ; backups Railway + commande `pg_dump` documentée.

Conséquence : pousser du code 100 fois → avancements, propositions, journaux, photos, historique restent intacts.

---

## 3. Pages & navigation

**Public (non connecté)**
- `/public` — Vue transparence (design du prototype : en-tête orange, jauge globale, 4 jauges axes, liste par axe + filtres). Données publiées uniquement, lecture seule. Mentions légales + politique données (RGPD §8.6).
- `/connexion` — Email + mot de passe.

**Connecté (élu + admin)**
- `/` — Tableau de bord : jauge globale, 4 jauges axes, répartition par statut, courbes d'évolution.
- `/mesures` — Liste détaillée par axe. Filtres : axe, référent, statut, échéance (en retard/à venir), recherche plein texte.
- `/mesures/[id]` — Fiche : binôme d'élus, coût, besoins, limites, échéance, jauge. Élu : proposer avancement (curseur), commentaire journal, joindre photo/doc/lien. Journal + pièces jointes + mini-courbe d'historique.
- `/par-elu` — Vue par référent.

**Admin uniquement**
- `/admin/validations` — File de validation (cœur) : ancienne → proposée, auteur, commentaire, Valider/Refuser (motif). Compteur « X à valider » en nav.
- `/admin/mesures` — Gérer mesures (ajouter/modifier/fusionner/scinder, référent + binôme, champs publics).
- `/admin/comptes` — Gérer comptes élus.

**Exports**
- Imprimer / PDF (`window.print` + CSS print à la charte) — phase 1.
- Export Excel/CSV des mesures — phase 1.
- Courbes d'évolution (global + par axe, depuis `Historique`) — tableau de bord.

**Navigation** : barre du haut, onglets selon rôle (élu ne voit pas l'admin), compteur validations pour l'admin. Responsive : bureau prioritaire, mobile soigné (saisie terrain + photos), nav repliée sur petit écran.

**Hors périmètre MVP (bonus §9, reportés en phase 2)** : emails récap hebdo (cron), vue par quartier, mode présentation plein écran, multi-projets paramétrable, PDF serveur (Playwright).

---

## 4. Technique, sécurité, livrables

**Stack** : Next.js (App Router) + TypeScript + React ; Prisma + Postgres (Railway) ; auth maison (cookie httpOnly signé, bcrypt). Permissions vérifiées **côté serveur** sur chaque route + middleware de protection des pages.

**Charte SNS** (impérative §7) : variables CSS depuis le prototype, police Poppins, couleurs exactes :
- Orange `#EE6B3E` · Orange foncé `#CD5026` · Fond `#FAF7F4` · Texte `#232326` · Gris `#6E6E73` · Orange pâle `#FCE9E1`
- Statuts : Non démarré `#9A9AA0` · Engagé `#C98A1A` · En cours `#EE6B3E` · Réalisé `#3A8540`
- Logo typographique « Seyssins Nature&Solidaire ». **Jamais le logo de la ville.**
- Composants : jauge donut, barre, carte, badge statut, chip.

**Sécurité (§8.7)** : mots de passe hashés bcrypt ; aucun secret côté client (`DATABASE_URL`, secret session en variables d'env serveur) ; upload photos validé (type/taille) ; stockage fichiers sur volume.

**RGPD (§8.6)** : mentions légales sur vue publique, données élus minimales, vigilance photos de chantier (pas de personnes identifiables sans base légale), hébergement UE.

**Import initial** : script `seed` idempotent → 67 mesures (Annexe C : axes, rubriques, intitulés, référents, coûts, avancements de départ) + comptes élus + binômes §4.3. Tourne une seule fois.

**Tests** (TDD sur le critique) : calcul du statut dérivé ; circuit de validation (proposition → publié + historique) ; permissions par rôle ; idempotence du seed.

**Livrables (§10)** :
1. App en local (`npm run dev`)
2. Code documenté + README déploiement Railway
3. Script d'import des 67 mesures
4. Comptes initiaux (admin + élus)
5. Doc utilisateur 1 page (proposer / valider)

---

*Document de conception validé section par section avec le commanditaire le 29 juin 2026. Référents et coûts = propositions de départ à confirmer.*
