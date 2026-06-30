# Table ronde finale — Audit consolidé Suivi SNS (web + mobile)

> 12 experts seniors, 82 suggestions. Code réel audité. Généré le 30 juin 2026.

I have confirmed the key code facts. Both confirmed: image route has no `lireSession()`, session has fallback secret and no `exp`, CSV `champ()` does not neutralize `=+-@`. Note: the CSV route shown here uses `eluReferent` include and `orderBy` — I should verify the `deletedAt` filter claim.

The CSV route confirms **no `where: { deletedAt: null }`** — soft-deleted measures are exported. All facts verified. I have everything needed for the deliverable.

---

# LIVRABLE FINAL — Suivi SNS : audit consolidé & feuille de route

*Synthèse tranchée de ~82 suggestions réduites à ~28 actions distinctes. Grille de valeur : (1) perte de données/contrôle = existentiel, (2) fuite = risque réputationnel politique, (3) adoption des 21 élus = seule métrique de succès, (4) le reste. Contexte décisif : 2 admins bénévoles, 22 comptes, budget nul, 6 ans.*

---

## PARTIE A — Tableau des suggestions retenues (fusionnées)

Légende Impact/Effort : 🔴 critique / 🟠 fort / 🟡 moyen / ⚪ faible — Effort : XS (<1 j) / S / M / L (gros).

### À FAIRE VITE

| Suggestion | Portée | Opportunité | Contrainte | Impact | Effort | VERDICT |
|---|---|---|---|---|---|---|
| **IDOR route image** (auth + `Cache-Control: private`) — sugg. 8, 43 | web+mobile | Ferme la fuite la plus exploitable : énumération séquentielle `/api/pieces-jointes/N/image` sans aucune auth (confirmé) | Distinguer pièces publiques (OG) des privées | 🔴 | XS | **À FAIRE VITE** — vérifié en prod, 5 lignes, scénario exact « fuite interne vers opposant » |
| **Fail-fast SESSION_SECRET** en prod — sugg. 3,12,52,60,73 | web | Empêche compromission admin totale « par accident d'infra » (re-provision Railway sur 6 ans) | Tension avec philosophie « jamais crash » de boot.mjs : c'est le seul cas où un 503 est voulu | 🔴 | XS | **À FAIRE VITE** — fallback `'dev-secret-change-me'` confirmé, 5 lignes |
| **Export CSV : filtre `deletedAt` + neutralisation injection formule** — sugg. 14 (+bug confirmé) | web | Corrige 2 bugs : exporte les mesures soft-deletées (confirmé, `findMany` sans `where`) ; `champ()` n'échappe pas `=+-@` (formule Excel piégée) | Apostrophe de tête sur certaines cellules | 🔴 | XS | **À FAIRE VITE** — double bug confirmé, ~5 lignes |
| **Backup externe automatisé + restauration TESTÉE** — sugg. 2,39,50,74 | web | Élimine le risque n°1 existentiel : aujourd'hui zéro backup hors Railway, juste un .md disant « pg_dump une fois par mois » | Garder le secret GPG hors-ligne ; investir dans le test de restore réel | 🔴 | M | **À FAIRE VITE** — 6 experts convergent ; la promesse « jamais de perte » est aujourd'hui un mensonge |
| **Bus factor : 2e détenteur des secrets + runbook 1 page** — sugg. 54 | — | Si Loïck disparaît, le projet meurt malgré les backups : risque existentiel que la technique ne résout pas | Élargit la surface de confiance (coffre, pas un mail) | 🔴 | XS | **À FAIRE VITE** — zéro code, valeur maximale, le plus sous-estimé du panel |

### À FAIRE

| Suggestion | Portée | Opportunité | Contrainte | Impact | Effort | VERDICT |
|---|---|---|---|---|---|---|
| **Durcir session.ts** : revérif `actif`/`role` en base + `exp` + maxAge 30 j révocable — sugg. 3,9,37,46,61,73 | web+mobile | Départ d'élu conflictuel = accès coupé immédiatement ; RGPD réel ; admin rétrogradé perd ses droits | 1 requête User/navigation (négligeable à 22 comptes, cacheable 10 s) | 🔴 | M | **À FAIRE** — fusion de 8 suggestions ; faire E avant d'allonger la session (tension 3) |
| **Toggle partage = vrai noindex** + robots.ts — sugg. 45 | web | Aujourd'hui le toggle masque QUE le bouton ; la page reste indexée par Google → théâtre de gouvernance, risque réserve électorale | Un noindex réduit la portée voulue en temps normal | 🟠 | S | **À FAIRE** — angle mort sous-évalué, juridiquement dangereux pour un outil politique |
| **ISR vue publique** (`revalidate=300` + `revalidatePath` on-write) — sugg. 5,15 | web | Encaisse un pic de partage (presse locale) sans saturer le service Railway unique ; double appel `toutesLesMesures` supprimé | Latence de fraîcheur (acceptable : page dit « arrêté au… ») | 🔴 | S | **À FAIRE** — la seule vraie optimisation perf qui mérite la passe |
| **Rate-limit login** (mémoire) + log audit + backoff doux — sugg. 7,11,43,60 | web | Bloque bruteforce/credential-stuffing sur 22 emails devinables | Backoff doux pour ne pas verrouiller un élu maladroit ; pas de survie au redéploiement (OK) | 🟠 | S | **À FAIRE** — zéro frein confirmé ; en mémoire suffit, table = sur-ingénierie ici |
| **Notifications ciblées** (référent/co-réf + digest hebdo opt-in) — sugg. 56 | web | `notifierTousSauf` notifie 21 élus à CHAQUE % → la cloche devient du bruit → l'app meurt | Migration additive + logique digest ; garder le sentiment d'élan collectif | 🟠 | M | **À FAIRE** — cause n°1 de mort d'un outil de groupe |
| **Corriger la courbe** (replay temporel, moyenne globale, axe X temps) — sugg. 63 | web | Aujourd'hui MENSONGÈRE : trace `nouveauPourcent` d'une mesure par index, pas la moyenne dans le temps (confirmé) ; graphe montré en conseil | Fonction pure à tester ; gérer mesures créées en cours de mandat | 🔴 | M | **À FAIRE** — bug confirmé grave ; un opposant qui le comprend a une arme |
| **Monitoring uptime externe** + `/api/health` sentinelle + boot.mjs remonte échec migration — sugg. 53,55,74 | web | Détection d'incident en minutes au lieu de jours ; attrape la catastrophe silencieuse (table vidée, migration ratée avalée) | Calibrer le seuil d'invariant (soft-delete) ; alerter 2 personnes | 🟠 | S | **À FAIRE** — gratuit (UptimeRobot), /api/health existe déjà |
| **CI GitHub Actions** (lint + tsc + test + build + migrate diff) — sugg. 70 | web | Les 4 tests existants ne gardent rien sans CI ; détecte migration oubliée avant prod | Discipline « toute modif schéma = migration commitée » | 🔴 | S | **À FAIRE** — gratuit, transforme des tests décoratifs en filet réel |
| **Fiabiliser envoi photo mobile** (progression N/M, retry, localStorage) — sugg. 59 | mobile | Levier d'adoption n°1 terrain : un envoi qui échoue en silence = « ça marche pas, je remets plus tard » = jamais | Retry/queue peu coûteux en localStorage (sans SW) | 🟠 | M | **À FAIRE** — l'adoption se gagne ici |
| **Contrôle d'objet sur propositions POST** (référent + `deletedAt`) — sugg. 14,72 | web | N'importe quel ELU propose sur n'importe quelle mesure, même soft-deletée (confirmé) → file polluée | Décision produit : référent-only ou ELU-libre ? | 🟠 | XS | **À FAIRE** — trancher la règle puis 3 lignes |
| **Tests d'intégration routes critiques** (validation, anonymisation) sur Postgres éphémère — sugg. 71 | web | Le cœur métier (transaction validation, RGPD, soft-delete) est 100% non testé | Postgres en CI + harnais cookies() ; 1-2 j | 🟠 | M | **À FAIRE** — sécurise toute refonte future |
| **Isoler blob photo en table 1-1** (`PieceJointeBlob`) — sugg. 1,16 (palier) | web | 80% du gain perf de R2 pour 1% de l'effort : `findMany` fiche mesure ne tire jamais le base64 | Migration additive | 🟡 | S | **À FAIRE** — le bon palier avant R2 (voir tension photos) |
| **RGAA socle** : `:focus-visible` + skip-link + labels associés — sugg. 26,29,32,33 | web+mobile | Obligation service public de fait ; zéro focus dans tout le code (confirmé) | Focus ring à accorder à la charte | 🟠 | S | **À FAIRE** — coût quasi nul, conformité bloquante |
| **Corriger calculs temporels** (Europe/Paris, jours pleins) — sugg. 62 | web | `mesuresASurveiller` mélange UTC (retard) et ms (dormance) — élu relancé à tort conteste l'outil en réunion | Impact frontière, mais ressort au pire moment | 🟡 | XS | **À FAIRE** — crédibilité des alertes |
| **next/font Poppins** + en-têtes sécu simples + manifest minimal — sugg. 6,13(partiel),19,82 | web+mobile | Réseau 4G dégradé OK, fuite IP Google supprimée (RGPD), icône brandée, en-têtes anti-clickjacking | Vérif licence (OFL OK) ; produire jeu d'icônes | 🟡 | S | **À FAIRE** — bloc de quick-wins groupés |
| **Patch polling cloche** (`document.hidden` + 5 min) — sugg. 5,20 | web | Supprime ~46 req/min permanentes pour une donnée rare | Latence cloche 5 min (acceptable) | ⚪ | XS | **À FAIRE** — 15 min de travail |
| **Tracer le diff des champs admin** (situation/échéance/coût) dans AuditLog — sugg. 38 | web | « Qui a basculé en abandonné et quand, valeur avant ? » est aujourd'hui impossible (audit générique) | 1 lecture avant update ; sérialiser dans `details` (déjà prévu) | 🟡 | S | **À FAIRE** — défendabilité politique d'un outil de transparence |

### PLUS TARD

| Suggestion | Portée | Opportunité | Contrainte | Impact | Effort | VERDICT |
|---|---|---|---|---|---|---|
| **Bilan de mi-mandat figeable** (snapshot agrégats) — sugg. 42,67 | web | Livrable politique central, immuable et citable | Dépend du moteur de replay ; cadrer au périmètre agrégats | 🟠 | L | **PLUS TARD** — échéance 2029, mais moteur prêt tôt (fusionné avec la courbe) |
| **Migration photos → R2/S3** — sugg. 1,16,51 | web+mobile | Base petite, dumps légers, LCP via CDN | Fournisseur + secret + cohérence base↔bucket + RGPD double système | 🟡 | L | **PLUS TARD** — conditionnel : seulement si backup devient lent (~an 3) ; pas avant |
| **Vue publique = racine `/`** + 301 — sugg. 76 | web | URL la plus partagée sert le bon contenu ; autorité SEO concentrée | Touche le proxy (zone auth sensible) ; 301 obligatoire | 🟡 | M | **PLUS TARD** — vrai gain visibilité mais après les fondations |
| **metadataBase + robots.ts + sitemap** — sugg. 77 | web | Aperçus sociaux fiables, indexation propre | Nécessite SITE_URL stable (domaine custom absent) | 🟡 | S | **PLUS TARD** — utile, dépend d'un domaine pérenne |
| **Distribution par statut** (barres empilées, données déjà calculées) — sugg. 66 | web | Raconte le vrai bilan (forme de distribution > moyenne) ; counts déjà calculés | — | 🟡 | XS | **PLUS TARD** — zéro risque ; commencer par ça, JAMAIS la pondération par coût |
| **Référence temporelle** (« X% pour Y% du mandat ») — sugg. 64 | web+mobile | Transforme un chiffre nu en histoire honnête | Hypothèse linéaire sensible (présenter comme indicatif) | 🟡 | XS | **PLUS TARD** — à cadrer avec Loïck/Julie |
| **Date d'arrêté réelle** (max historique, pas today) — sugg. 65 | web | Honnêteté : aujourd'hui affiche toujours today (fausse fraîcheur) | Expose publiquement l'inactivité (c'est le but) | 🟡 | XS | **PLUS TARD** — coupler à la relance admin |
| **Delta/sparkline sur jauges** — sugg. 23,68 | web+mobile | Sentiment de progression (motivation élus) ; données déjà chargées | Sobriété sur mobile | 🟡 | M | **PLUS TARD** — narratif, après le moteur d'historique |
| **Courbe : axes/valeurs/alt textuelle** — sugg. 27,69 | web+mobile | Lisibilité + accessibilité du graphe héros | À refaire après correction de la série | 🟡 | S | **PLUS TARD** — après le fix de fond (sugg. 63) |
| **Validation déléguée + âge des propositions** — sugg. 57 | web | Sort les 2 admins du chemin critique (2e cause de mort des outils) | Touche permissions + sens éditorial | 🟠 | M | **PLUS TARD** — afficher l'âge d'abord (XS), déléguer ensuite |
| **Relance ciblée par userId + mesures listées** — sugg. 58 | web+mobile | `findFirst({where:{nom}})` fragile (homonymes) ; relance vague = inaction | Borner la fréquence (anti-flicage) | 🟡 | XS | **PLUS TARD** — quick-win adoption |
| **Concurrence propositions** (signaler propositions parallèles) — sugg. 41 | web+mobile | Évite incohérences publiées entre co-référents | Surcharge la file ; modèle ne stocke pas l'avancement au moment de la proposition | 🟡 | M | **PLUS TARD** — réel mais rare à 22 comptes |
| **Droit à l'image / consentement upload** — sugg. 44 | web+mobile | Contentieux art. 9 C. civ. + RGPD ; strip EXIF/GPS | UX d'une seule case ; strip EXIF PDF = lib | 🟠 | M | **PLUS TARD** — réel, mais vue publique n'affiche pas les photos aujourd'hui |
| **Mentions légales complètes + canal droits** — sugg. 49 | web | Conformité info art. 13-14 ; crédibilité | Obligation de traiter les demandes sous 1 mois | 🟡 | S | **PLUS TARD** — rédaction, peu de code |
| **Politique de rétention/purge** (audit, notifs, soft-delete 30 j) — sugg. 47,55 | web | Aligne le code sur la promesse RGPD ; borne la croissance | Tension inaltérabilité ↔ minimisation (pseudonymiser, pas supprimer) | 🟡 | M | **PLUS TARD** — après que les backups fonctionnent (purge irréversible) |
| **Index Postgres manquants** — sugg. 17 | web | Requêtes O(log n) quand l'historique gonfle | Migration additive triviale | ⚪ | XS | **PLUS TARD** — indolore à 67 mesures, à faire en touchant le schéma |
| **Borner requêtes non paginées** (historique dashboard) — sugg. 18 | web | Payload constant sur 6 ans | Décider granularité courbe | 🟡 | S | **PLUS TARD** — couplé à la correction de la courbe |
| **Pool pg + output standalone** — sugg. 19 | web | Garde-fou connexions Postgres ; image plus légère | Calibrer max pool ; valider Railway | 🟡 | XS | **PLUS TARD** — passe perf Railway |
| **ETag/304 route image** — sugg. 21 | web | Moins de CPU décodage base64 | Redondant si R2 | ⚪ | XS | **PLUS TARD** — palliatif si R2 repoussé |
| **Design tokens partagés** — sugg. 22,33 | web+mobile | Une source de vérité couleur/typo sur 6 ans (206 hex en dur) | Refactor transverse ; étaler | 🟡 | L | **PLUS TARD** — jamais en big-bang |
| **Soigner le moment public** (hero, axes colorés, fil daté, feedback partage) — sugg. 25,28 | web+mobile | Conversion émotionnelle du visiteur | Rester sobre (séparation mairie) | 🟡 | M | **PLUS TARD** — après ISR et racine |
| **Mode présentation/photos clavier + alt** — sugg. 36 | web | Opérabilité clavier réunion | Esthétique plein écran | ⚪ | S | **PLUS TARD** |
| **Annonce filtrage aria-live** — sugg. 34 | web+mobile | Filtrage utilisable au lecteur d'écran | Debounce verbosité | 🟡 | XS | **PLUS TARD** — avec la passe RGAA |

### À ÉVITER (sur-ingénierie pour ce contexte)

| Suggestion | Portée | Pourquoi rejeté | Impact | Effort | VERDICT |
|---|---|---|---|---|---|
| **PWA installable + service worker complet** — sugg. 40 | mobile | « Un SW mal cadré = bugs de cache bloqués chez des élus non techniques sur 6 ans » (dit par le panel lui-même). Dette permanente pour 2 bénévoles | 🟠 | L | **À ÉVITER** — garder manifest minimal (sugg. 82) sans le SW |
| **Table Session/jti + rolling refresh sophistiqué** — partie de 3,9,73 | web | Sur-dimensionné pour 22 comptes ; `actif=false` + reconnexion suffit, `sessionVersion` comme kill-switch | 🟡 | M | **À ÉVITER** — la revérif base (retenue) couvre le besoin |
| **CSP stricte à nonces en RSC** — sugg. 13 | web+mobile | Refactor non-trivial sur app à styles inline pour bénéfice marginal | 🟡 | L | **À ÉVITER** — garder les en-têtes simples uniquement |
| **Pondération moyenne par coût** — sugg. 66 | web | Débat politique + champ coût mal renseigné = pondération bancale | 🟡 | M | **À ÉVITER** — la distribution par statut suffit |
| **SEO avancé** : JSON-LD, sitemap par engagement, 67 OG dynamiques — sugg. 78,81 | web+mobile | Gain réel modeste pour 8000 hab ; charge de génération OG sur Railway nul | 🟡 | M | **À ÉVITER** — le toggle noindex (45) prime sur tout le SEO |
| **Mode réserve électorale automatisé** — sugg. 48 | web | Date de scrutin inconnue à l'avance ; pilotable manuellement | 🟡 | M | **À ÉVITER** — un toggle noindex manuel suffit |
| **Maîtriser le récit OG défavorable / spin** — sugg. 80 | web | Tension éthique avec l'outil de transparence ; nuit à la crédibilité | 🟡 | S | **À ÉVITER** — incompatible avec la posture |
| **Cartes-liens accessibles (refonte)** — sugg. 35 | web+mobile | Motif subtil, effort de test élevé pour gain modéré | 🟡 | M | **À ÉVITER pour l'instant** — la passe RGAA socle suffit |

---

## PARTIE B — Plan d'action priorisé

### 🌊 Vague 1 — Cette semaine (quelques heures, risque existentiel/réputationnel)

**Faire AVANT toute optimisation. Ce sont des correctifs de quelques lignes ou des actions sans code.**

1. **IDOR route image** — Dans `src/app/api/pieces-jointes/[id]/image/route.ts` : ajouter `const session = await lireSession(); if (!session) return 401` en tête, et passer `Cache-Control` de `public, immutable` à `private, max-age=...`. Pour l'OG public, isoler explicitement les pièces marquées publiques.
2. **Fail-fast SESSION_SECRET** — Dans `src/lib/session.ts` : remplacer le `?? 'dev-secret-change-me'` par un `throw` au boot si `NODE_ENV === 'production'` et secret absent/trop court. Exposer un booléen `secretConfigure` dans `/api/health` (sans révéler la valeur).
3. **Export CSV** — Dans `src/app/api/export/csv/route.ts` : ajouter `where: { deletedAt: null }` au `findMany` (bug confirmé), et dans `champ()` préfixer une apostrophe si la valeur commence par `= + - @`.
4. **Backup externe** — Cron GitHub Actions (gratuit, schedule) : `pg_dump $DATABASE_URL | gzip | gpg -c` → push vers Backblaze B2 ou R2. Rétention glissante (7 quotidiens + 6 mensuels). **Crucial : rejouer une restauration réelle sur une base jetable une fois, mesurer le RTO, documenter.** Le dump capture le base64 → backup indépendant de la migration photos.
5. **Bus factor** — Un 2e admin de confiance détient une copie hors-ligne des secrets (SESSION_SECRET, accès Railway, clé GPG backup) + un runbook 1 page : où sont les backups, comment réinjecter un dump, comment recréer le projet sur Render/Fly/Neon. Zéro code.

### 🌊 Vague 2 — Le mois suivant (fondations 6 ans)

6. **Durcir session.ts** — `lireSession()` recharge l'utilisateur en base : rejeter si `!actif || anonymiseLe != null`, prendre le `role` de la base (pas du cookie). Ajouter `exp` dans le payload signé, vérifié dans `verifierToken`. Une fois ceci en place, passer maxAge à **30 j + rolling refresh** (la révocation serveur sert de filet → session longue non dangereuse, gain adoption).
7. **Rate-limit login** — Compteur en mémoire process par email+IP, backoff doux (pas de lockout dur), log des échecs répétés dans l'AuditLog existant.
8. **Toggle partage réel** — Le param `partage_public_autorise=non` doit piloter un `meta robots noindex` + header `X-Robots-Tag` (pas seulement masquer le bouton). Ajouter `src/app/robots.ts` (autorise `/public` + mentions, bloque `/admin`, `/api`, `/mes-mesures`, `/connexion`).
9. **ISR vue publique** — Remplacer `force-dynamic` par `revalidate=300` dans `public/page.tsx` et `opengraph-image.tsx` ; envelopper `toutesLesMesures` dans `unstable_cache` + `revalidatePath('/public')` à la validation admin ; factoriser le double appel via React `cache()`. **Patch cloche** : pause sur `document.hidden`, intervalle 5 min.
10. **Monitoring** — Brancher UptimeRobot (gratuit) sur `/api/health` toutes les 5 min, alerter Loïck ET Julie. Enrichir `/api/health` en sentinelle d'invariant (503 si `nbMesures` ou `nbComptes` s'effondre anormalement, en tolérant le soft-delete). Faire remonter par `boot.mjs` un échec réel de `migrate deploy` (vs no-op).
11. **Notifications ciblées** — Remplacer `notifierTousSauf` par : notif à l'auteur (gardée) + référent/co-référents de LA mesure + préférence par compte (colonne additive) + digest hebdo opt-in.
12. **CI GitHub Actions** — `.github/workflows/ci.yml` : `npm ci`, lint, `tsc --noEmit`, `npm test`, `npm run build`, Postgres jetable + `migrate deploy` + `migrate diff --exit-code`. Statut requis sur main.

### 🌊 Vague 3 — Moyen terme (valeur narrative & robustesse)

13. **Moteur de replay temporel** — Reconstruire la vraie série de la moyenne pondérée du programme à partir de `Historique` (`ancienPourcent`/`nouveauPourcent`/`date`), échantillonnée par mois, axe X temporel, Y 0-100. Fonction pure testée Vitest. **Corrige la courbe mensongère ET alimente le futur bilan figeable.**
14. **Tests d'intégration** — Postgres éphémère (Testcontainers/docker CI) : valider une proposition crée 1 entrée Historique correcte ; proposition déjà traitée → 404 ; DELETE compte anonymise mais conserve les liens ; impossible de supprimer son propre compte.
15. **Isoler blob photo** — Table `PieceJointeBlob` 1-1 (migration additive) : les `findMany` sur fiche mesure ne tirent plus le base64. Palier avant R2.
16. **Fiabiliser photo mobile** — Progression « 2/5 », retry automatique, localStorage des fichiers non envoyés (même pattern que le brouillon de proposition).
17. **RGAA socle** — Dans `globals.css` : `:focus-visible { outline: 3px solid #C0461F; offset 2px }` (variante claire sur header orange) ; `<a href="#contenu" class="skip">` + `<main id="contenu">` ; labels `htmlFor`/`id` sur tous les formulaires ; remplacer `#9A9AA0`/`#EE6B3E`-texte par `#C0461F`/`#6E6E73` ; `@media prefers-reduced-motion`.
18. **Quick-wins groupés** — next/font Poppins (graisses réellement utilisées), en-têtes sécu simples via `next.config` (`X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`), manifest minimal + theme-color `#EE6B3E` + apple-touch-icon, contrôle d'objet sur propositions POST, calculs temporels Europe/Paris, diff admin dans AuditLog.

**Puis (sans urgence) :** distribution par statut, référence temporelle, date d'arrêté réelle, delta/sparkline, validation déléguée, relance ciblée, droit à l'image, mentions légales, rétention/purge, design tokens, soin du moment public, index Postgres.

### ❌ À éviter pour ce contexte

PWA/service worker complet (dette de cache) · table Session/jti (sur-ingénierie 22 comptes) · CSP à nonces · pondération par coût · SEO avancé (JSON-LD/sitemap par engagement/67 OG) · mode réserve automatisé · spin OG.

---

### 🎯 Les 7 priorités absolues, toutes confondues

1. **Backup externe chiffré + restauration testée** — la promesse « jamais de perte » est aujourd'hui fausse (existentiel).
2. **Bus factor : 2e détenteur des secrets + runbook** — si Loïck disparaît, rien ne sauve le projet (existentiel, zéro code).
3. **IDOR route image** — fuite de photos/documents internes par énumération, sans auth (confirmé, réputationnel).
4. **Fail-fast SESSION_SECRET** — compromission admin totale possible par accident d'infra (confirmé).
5. **Durcir la session** (revérif base + exp) — départ d'élu conflictuel = accès non révocable 7 j (RGPD + politique).
6. **ISR vue publique** — un pic de partage peut saturer le service Railway unique.
7. **Corriger la courbe d'évolution** — graphe montré en conseil municipal, littéralement mensonger (crédibilité politique).

---

### 📌 Note spéciale — optimisation performance / coût Railway (prochain chantier)

Le bon ordre, du plus rentable au moins :

1. **ISR + revalidate-on-write sur la vue publique** *(le seul vrai sujet)* — division par ~10-100 des requêtes Postgres sur le chemin le plus fréquenté ; c'est la différence entre rester dans le quota et exploser la facture le jour d'un partage viral. Asymétrie de risque maximale.
2. **Patch polling cloche** — supprime un bruit de fond permanent (~46 req/min h24) pour 15 min de travail.
3. **Isoler le blob photo en table 1-1** — empêche les `findMany` de fiche mesure de tirer le base64 ; 80% du gain de R2 pour 1% de l'effort.
4. **Pool pg `max` explicite + `output: 'standalone'`** — garde-fou connexions sous pic, image Docker plus légère.
5. **Index Postgres manquants** (`deletedAt`, FK `mesureId`, `Proposition.statut`, `Historique[mesureId,date]`) — indolore aujourd'hui, prévient la dérive « l'app rame en année 4 ».
6. **Borner les requêtes non paginées** (historique dashboard sans `take`) + restreindre les `include`/`select`.

**Ce qu'il NE faut PAS faire dans cette passe :** migrer les photos vers R2. Le calcul réel (~1 Go/an, 5-6 Go sur 6 ans) ne justifie pas d'introduire un fournisseur de plus, un secret de plus et une cohérence base↔bucket à 2 admins bénévoles. **Le backup ne dépend PAS de cette migration** (le dump capture le base64) — le panel SRE qui les couple a tort. R2 devient prioritaire seulement *si* le dump devient effectivement lent/cher, soit vers l'année 3.

Le fil rouge : cet outil ne mourra pas d'un manque de scalabilité ni d'un design imparfait. Il mourra si on perd les données, si une fuite le décrédibilise, si Loïck disparaît, ou si les 21 élus arrêtent de l'ouvrir. Optimisez pour ça, dans cet ordre.

---

# DÉBAT INTÉGRAL

The code confirms the critical claims. Notably: the image route (IDOR confirmed — no `lireSession`), session has no `exp` and no DB revalidation, login has no rate-limit, `SECRET` fallback is real, propositions POST doesn't check referent ownership or `deletedAt`, CSV export confirms formula-injection (no `=+-@` neutralization), and `mesuresASurveiller` mixes UTC date-string comparison with ms-based dormancy. The CSV export also notably has **no `deletedAt: null` filter** — a confirmed bug (exports soft-deleted measures). I have what I need.

---

# Table ronde — Suivi SNS : débat tranché

J'ai présidé, mais j'ai d'abord relu le code. Plusieurs « risques théoriques » du panel sont des **bugs confirmés en prod**, d'autres sont du folklore d'ingénieur. Voici le verdict, sans complaisance.

## Le contexte qui tranche tout

Deux chiffres dominent tout le reste : **2 admins, ~22 comptes internes, budget nul, 6 ans, bénévoles**. Ce n'est pas une scale-up. C'est un outil militant qui doit *survivre à l'indisponibilité de son auteur*. Donc la grille de valeur n'est pas « sécurité vs perf vs design » — c'est :

1. **Est-ce qu'on perd les données / le contrôle ?** (existentiel)
2. **Est-ce qu'une fuite tue la crédibilité politique ?** (réputationnel, propre à cet outil)
3. **Est-ce que les 21 élus continuent de l'utiliser ?** (adoption = la seule métrique de succès)
4. Le reste.

Tout ce qui scale, optimise pour 8000 utilisateurs simultanés, ou raffine le design system est secondaire tant que 1-2-3 ne sont pas tenus.

---

## CONSENSUS FORTS (5 experts ou plus convergent — ce sont des faits, pas des opinions)

Cinq sujets reviennent depuis 4-6 angles indépendants. Quand le SRE, le sécu, le PM, le juriste et le QA disent la même chose, le débat est clos :

**A. Sauvegardes externes + restauration testée** (sugg. 2, 39, 50, 74). *Existentiel, non négociable.* Aujourd'hui : zéro backup hors Railway, juste un `docs/sauvegarde.md` qui dit à un humain de lancer `pg_dump` « une fois par mois ». Pour un outil dont la promesse n°1 est « jamais de perte de données », c'est un mensonge. **Tranché : priorité absolue. Cron GitHub Actions (gratuit) → `pg_dump | gzip | gpg -c` → Backblaze B2/R2, rétention glissante, ET une restauration réellement rejouée une fois.** Une sauvegarde jamais restaurée n'existe pas.

**B. IDOR sur la route image** (sugg. 8, 43). *Vérifié dans le code.* `findUnique({where:{id}})` puis renvoi du binaire, **sans `lireSession()`**, id auto-incrémenté énumérable, `Cache-Control: public, immutable`. Un opposant boucle sur `/api/pieces-jointes/1..N/image` et aspire toutes les photos et documents internes (coûts non publics, motifs d'abandon). C'est *exactement* le scénario redouté. **Tranché : correctif de 5 lignes, à faire cette semaine.** Exiger une session + passer le cache en `private`.

**C. SESSION_SECRET avec fallback en dur** (sugg. 3, 12, 52, 60, 73). *Vérifié :* `process.env.SESSION_SECRET ?? 'dev-secret-change-me'`. Si la var saute (re-provision Railway sur 6 ans = scénario réaliste), l'app démarre en silence avec un secret public → n'importe qui forge un cookie admin. **Tranché : fail-fast au boot en prod. ~5 lignes.**

**D. Sortir les photos base64 de Postgres** (sugg. 1, 16, 39, 51, 59, 74). *Six experts.* Structurellement juste. **Mais — voir tension ci-dessous, c'est là que je diverge du panel.**

**E. Révocation de session** (sugg. 3, 9, 37, 46, 61, 73). Le cookie HMAC fige `{userId, role}` 7 jours, jamais revérifié en base. Un élu désactivé/anonymisé garde l'accès 7 jours ; un admin rétrogradé reste admin. **Tranché : revérifier `actif`/`role` en base — mais pas comme le panel le propose. Voir ci-dessous.**

---

## LES VRAIES TENSIONS — je tranche chacune

### Tension 1 — Photos hors-base : structurellement vrai, mais priorité surévaluée (D vs simplicité)

Six experts veulent migrer vers R2/S3 *maintenant*. Je **freine**.

Le raisonnement « plusieurs Go en 6 ans » est juste *en tendance* mais faux *en urgence*. Faites le calcul réel : cap à ~2 Mo/photo, 67 mesures, 21 élus. Même à un rythme généreux de 500 photos/an, on est à ~1 Go/an. Sur 6 ans, 5-6 Go. C'est gros pour un dump, ce n'est pas une catastrophe Postgres. Et surtout : **introduire R2 = un fournisseur de plus, un secret de plus, une cohérence référentielle base↔bucket à garantir lors d'une restauration croisée, une suppression RGPD à propager sur deux systèmes.** Pour 2 admins bénévoles, c'est exactement le genre de complexité qui se retourne contre vous en année 3 (« c'est quoi déjà les creds du bucket ? »).

**Tranché — séquencement, pas big-bang :**
- **Immédiat (sugg. 8, contre-poison du base64) :** isoler le blob dans une table `PieceJointeBlob` 1-1 (migration additive triviale) pour que les `findMany` sur fiche mesure ne tirent JAMAIS le base64. Ça résout 80 % de la douleur perf pour 1 % de l'effort de R2.
- **Conditionnel :** la migration objet ne devient prioritaire **que si** la sauvegarde devient effectivement lente/chère — ce qui n'arrivera pas avant ~3 ans. La décourpler du « jamais de perte de données » : le dump capture le base64, donc le backup (A) ne dépend PAS de la migration objet. Le panel SRE qui les couple a tort sur ce point.

Le contre-argument design (LCP mobile via CDN, sugg. 16) est réel mais marginal : la vue publique **n'affiche pas les photos** aujourd'hui. Donc le gain LCP est hypothétique. **R2 = chantier de moyen terme, pas la passe d'optimisation actuelle.**

### Tension 2 — Révocation de session : sécurité réelle vs sur-ingénierie (table Session + jti)

Le besoin (E) est réel et confirmé. Mais le panel sécu/QA dérive vers une **table Session révocable avec `jti`** — c'est de la sur-ingénierie pour 22 comptes.

**Tranché :**
- **À faire :** dans `lireSession()` (ou un helper serveur unique), recharger l'utilisateur et rejeter si `!actif || anonymiseLe != null`, **et prendre le rôle depuis la base, pas le cookie.** Une requête User par navigation à 22 comptes = négligeable, cacheable 10 s. Ça ferme le départ d'élu conflictuel ET aligne le RGPD.
- **À NE PAS faire maintenant :** table Session/jti, rolling refresh sophistiqué. Le besoin de « révoquer une session précise » (téléphone perdu) sur 22 personnes se règle par `actif=false` + reconnexion. Un champ `sessionVersion` sur User (incrémenté au changement de mdp) suffit comme kill-switch si besoin un jour.
- **Ajouter un `exp` dans le payload** (sugg. 73) : oui, 1 ligne, élimine le rejeu indéfini d'un token copié.

### Tension 3 — Sessions longues (adoption) vs courtes (sécurité)

L'élu de terrain (sugg. 61) veut 30-90 j pour que les non-technophiles ne se reloguent pas sans cesse. Le sécu veut court. **Tranché en faveur de l'adoption, conditionnée à E :** une fois la revérification `actif` en base en place (tension 2), une session longue **n'est plus dangereuse** car révocable instantanément côté serveur. Donc : **maxAge 30 j + rolling refresh**, et la révocation sert de filet. Les deux camps sont réconciliables — il fallait juste faire E *d'abord*.

### Tension 4 — Anti-bruteforce login : nécessaire, mais pas en table

Quatre experts (7, 11, 43, 60) veulent un rate-limit. *Vérifié : zéro frein sur `/api/auth/login`.* Cible réelle (emails d'élus devinables). **Tranché : rate-limit en mémoire process** (Railway mono-instance, ça suffit) + log des échecs dans l'AuditLog existant + backoff *doux* (pas de lockout dur — un élu maladroit qui se fait verrouiller, c'est un élu qui abandonne, cf. sugg. 11/60). Pas de table de compteurs : sur-ingénierie ici. Le « ne survit pas au redéploiement » est un faux problème à cette échelle.

### Tension 5 — Vue publique : force-dynamic vs ISR (le seul vrai sujet perf)

C'est LE point où le contexte « pic de partage viral » rencontre « service Railway unique ». Confirmé : `public/page.tsx` est `force-dynamic`, double appel `toutesLesMesures()` (metadata + render), OG image regénérée à chaque scrape. **Tranché : oui, ISR `revalidate=300` + `revalidatePath('/public')` au moment de la validation admin.** La fraîcheur « temps réel » est un faux besoin : la page dit elle-même « données arrêtées au… ». C'est la seule optimisation perf qui mérite la passe actuelle, parce que le coût est asymétrique (un partage presse locale peut saturer le service unique). Le polling notif (sugg. 5, 20) : juste `document.hidden` + intervalle 5 min. 15 minutes de travail, pas un chantier.

### Tension 6 — Bilan de mi-mandat & courbe « fausse » : valeur politique vs effort

Sugg. 63 est un **bug confirmé et grave** : la courbe trace `nouveauPourcent` d'une mesure individuelle par index (pas le temps, pas la moyenne globale). Elle est littéralement mensongère, et c'est le graphe montré en conseil municipal. **Un opposant qui comprend le bug a une arme.** **Tranché : à corriger (fort/petit-moyen), c'est de la crédibilité, pas du cosmétique.** Le replay temporel (modèle Historique a `ancienPourcent/nouveauPourcent/date`, tout est là) sert *à la fois* la courbe correcte ET le bilan figeable (sugg. 67) — **fusionner : un seul moteur de replay, testé en Vitest.** Le bilan figeable lui-même reste moyen terme (échéance 2029), mais le moteur doit exister tôt.

---

## REDONDANCES À FUSIONNER (le panel se répète énormément)

- **Backup externe :** 2 = 39 = 50 = 74 → **une seule action.**
- **Photos hors-base :** 1 = 16 = 51 ; 59 et 74 en sont des variantes → **une seule décision (séquencée, cf. tension 1).**
- **Révocation/secret/exp session :** 3 = 9 = 12 = 37 = 46 = 52 = 60 = 61 = 73 → **un seul chantier « durcir session.ts ».**
- **Anti-bruteforce :** 7 = 11 = 43 = 60 → **une seule action.**
- **Focus visible + RGAA socle :** 26 = 29 → **un bloc CSS `:focus-visible` + skip-link.**
- **next/font Poppins :** 6 = 19 = (13 partiellement) → **une seule migration.**
- **Polling cloche :** 5 = 20 → **un patch.**
- **Courbe + bilan figeable + replay :** 42 = 63 = 67 → **un moteur.**
- **Design tokens :** 22 = 23 = 33 partiellement → **une passe tokens.**

Le panel a produit ~82 suggestions ; il y a en réalité **~25 actions distinctes.**

---

## GADGET / SUR-INGÉNIERIE vu le contexte réel

Je suis franc — voici ce qui ne mérite pas d'effort maintenant :

- **PWA installable + service worker complet** (sugg. 40) : « un SW mal cadré crée des bugs de cache bloqués chez des élus non techniques sur 6 ans » — le panel le dit lui-même. Pour 2 admins bénévoles, un SW est une **dette de maintenance permanente**. **Rejeté.** En revanche, **manifest minimal + theme-color + apple-touch-icon (sugg. 82)** = oui, c'est 30 min, ça donne l'icône brandée sans le piège du cache. La file d'attente photo offline (sugg. 59) : utile, mais réalisable en localStorage simple sans SW.
- **Table Session/jti, rolling refresh sophistiqué** (parties de 3, 9, 73) : sur-dimensionné pour 22 comptes.
- **CSP stricte avec nonces en RSC** (sugg. 13) : refactor non-trivial pour un bénéfice marginal sur une app à styles inline. Les en-têtes simples (`X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options`) via `next.config` = oui, 10 min. La CSP nonce = non.
- **Pondération de la moyenne par coût** (sugg. 66) : ouvre un débat politique (« un engagement cher n'est pas plus important »), champ coût mal renseigné. **La distribution par statut (déjà calculée !) suffit** et a zéro risque.
- **Mode réserve électorale automatisé, JSON-LD, sitemap par engagement, 67 pages OG dynamiques** (48, 78, 81) : SEO/comm soigné pour une commune de 8000 hab — gain réel modeste. **Le toggle noindex réel (sugg. 45) est plus important que tout le reste du SEO** (voir angle mort ci-dessous).
- **Snapshot figeant intégralement textes + pièces jointes** (partie de 42) : cadrer au périmètre agrégats uniquement.

---

## ANGLES MORTS — ce que personne n'a assez vu (j'ai regardé le code)

1. **Le toggle de partage public est un théâtre de gouvernance (sugg. 45 — sous-évaluée).** `partage_public_autorise=non` ne masque QUE le bouton « Partager ». La page `/public` reste 100 % accessible et indexable. **L'admin croit couper la diffusion ; Google continue d'indexer.** Pour un outil politique en période pré-électorale, c'est un risque juridique réel (réserve électorale) déguisé en réglage. **Le toggle doit piloter un vrai `noindex` + `X-Robots-Tag`.** C'est plus grave que classé.

2. **Bug confirmé dans l'export CSV : pas de filtre `deletedAt`.** `export/csv` fait `findMany({orderBy:{ordre}})` **sans `where: {deletedAt: null}`** — il exporte les mesures soft-deletées. Combiné à l'**injection de formule CSV** (sugg. 14 : `champ()` n'échappe pas `=+-@`), un admin qui exporte peut voir des mesures censées disparues ET exécuter une formule piégée dans Excel. Personne n'a vu le `deletedAt` manquant. **2 lignes à corriger.**

3. **Bus factor = 1 (sugg. 54 — la plus sous-estimée du panel).** Loïck détient seul les accès Railway, le SESSION_SECRET, la future clé de backup. S'il devient indisponible en plein mandat, **le projet meurt et les données sont irrécupérables**, peu importe la qualité des backups. C'est *le* risque existentiel que la technique ne résout pas. **Un second admin de confiance doit détenir une copie hors-ligne des secrets + un runbook court de reprise.** Aucune ligne de code, valeur maximale.

4. **Incohérence temporelle confirmée (sugg. 62).** `mesuresASurveiller` mélange comparaison de chaînes ISO en **UTC** (`toISOString().slice(0,10)`) pour le retard et calcul **ms** pour la dormance. À Paris, une mesure peut être « en retard » un jour trop tôt. Un élu relancé à tort conteste l'outil en réunion — érosion de légitimité. Petit, mais c'est le bug qui ressort au pire moment.

5. **`boot.mjs` avale les échecs de migration (sugg. 55/74).** La philosophie « jamais de crash » sert du code neuf contre un schéma non migré, en silence. Au minimum : distinguer échec réel vs no-op et l'exposer dans `/api/health`. Couplé au monitoring uptime (sugg. 53), c'est ce qui transforme une catastrophe silencieuse en alerte.

6. **`propositions` POST n'a aucun contrôle d'objet (confirmé) :** n'importe quel ELU propose sur n'importe quelle `mesureId`, même soft-deletée (pas de check `deletedAt`, `Number(mesureId)` sans vérif d'existence). Propositions orphelines, pollution de la file admin. **Décision produit à trancher** (référent-only ou ELU-libre ?) puis 3 lignes de garde.

---

## WEB vs MOBILE — distinction nette

**Mobile (les 21 élus en saisie terrain — c'est ici que l'adoption se gagne ou se perd) :**
- Fiabiliser l'envoi photo : progression « 2/5 », retry, localStorage des non-envoyés (sugg. 59) — **levier d'adoption n°1.** Un envoi qui échoue en silence = « ça marche pas, je remets plus tard » = jamais.
- next/font (réseau dégradé 4G, sugg. 19), manifest minimal (sugg. 82), session longue (tension 3).
- **PAS de PWA/SW complet** (dette).

**Web (les 2 admins + la vue publique) :**
- ISR public (tension 5), backup, sécu session, courbe corrigée, toggle noindex réel.
- Notifications ciblées (sugg. 56) : aujourd'hui `notifierTousSauf` notifie les 21 élus à CHAQUE % validé → la cloche devient du bruit → l'app meurt. **Cibler référent/co-référents + digest hebdo opt-in.** C'est du web mais ça conditionne l'adoption mobile.

---

## VERDICT HIÉRARCHISÉ — la feuille de route que je signe

**Vague 0 — cette semaine, quelques heures, risque existentiel/réputationnel (faites-le avant l'optimisation) :**
1. Auth sur la route image + cache `private` (IDOR confirmé) — *5 lignes*
2. Fail-fast SESSION_SECRET en prod — *5 lignes*
3. Filtre `deletedAt` manquant sur l'export CSV + neutralisation injection formule — *5 lignes*
4. Backup externe automatisé chiffré + **une** restauration testée — *1 jour*
5. Bus factor : second détenteur des secrets + runbook 1 page — *2 heures, zéro code*

**Vague 1 — le mois suivant, fondations 6 ans :**
6. Durcir session.ts : revérif `actif`/`role` en base + `exp` + maxAge 30 j révocable (fusion de 8 suggestions)
7. Rate-limit login en mémoire + log audit
8. Toggle partage = vrai `noindex`/robots.ts
9. ISR vue publique + revalidate-on-write + patch polling cloche
10. Monitoring uptime externe gratuit + `/api/health` sentinelle d'invariant + boot.mjs qui remonte les échecs de migration
11. Notifications ciblées (anti-bruit) — adoption
12. CI GitHub Actions (sugg. 70) : les 4 tests existants ne gardent rien sans CI

**Vague 2 — moyen terme, valeur narrative & robustesse :**
13. Corriger la courbe (replay temporel) + moteur réutilisable pour le bilan figeable
14. Tests d'intégration des routes critiques (validation, anonymisation) sur Postgres éphémère
15. Isoler le blob photo en table 1-1 (palier avant R2)
16. Fiabilisation envoi photo mobile (retry/queue localStorage)
17. RGAA socle (focus-visible + skip-link + labels) — obligation de service public de fait
18. next/font + en-têtes sécu simples + manifest minimal

**Conditionnel / différé :** migration objet R2 (seulement si backup devient lent), bilan figeable complet (2029), design tokens (étalé, jamais big-bang).

**Rejeté pour ce contexte :** PWA/SW complet, table Session/jti, CSP à nonces, pondération par coût, SEO avancé (JSON-LD/sitemap par engagement), mode réserve automatisé.

Le fil rouge : **cet outil ne mourra pas d'un manque de scalabilité ou d'un design imparfait. Il mourra si on perd les données, si une fuite le décrédibilise politiquement, si Loïck disparaît, ou si les 21 élus arrêtent de l'ouvrir.** Optimisez pour ça, dans cet ordre.

---

Fichiers de référence vérifiés : `/Users/loickferrucci/Desktop/suivi-sns/src/lib/session.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/proxy.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/pieces-jointes/[id]/image/route.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/auth/login/route.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/propositions/route.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/propositions/[id]/route.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/lib/requetes.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/export/csv/route.ts`, `/Users/loickferrucci/Desktop/suivi-sns/src/app/api/health/route.ts`.
