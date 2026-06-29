# Panel d'experts — Améliorations de l'application Suivi SNS

> 14 experts, 90 améliorations proposées, débat contradictoire puis synthèse priorisée.
> Généré le 29 juin 2026. Les experts ont lu le code réel du projet.

---

# SYNTHÈSE FINALE

J'ai assez d'éléments. La courbe est dérivée de l'historique des validations (pas de table snapshot dédiée — point 6/85 confirmé). Pas de rate-limiting, pas d'OpenGraph public, pas d'email. J'ai tout le contexte réel nécessaire pour produire la synthèse ancrée dans le code existant.

---

# SYNTHÈSE FINALE — Plan d'améliorations priorisé : Suivi SNS 2026-2032

## État réel du code (vérifié, écarts vs brief)

Le projet est plus avancé que le brief ne le suggère. Plusieurs « urgences » du panel sont **déjà traitées** ou **mal cadrées** :

- **Pièces jointes : PAS sur le filesystem.** Le schema stocke `contenu String?` = data URL base64 **en base Postgres** (migration `pieces_jointes_contenu`). Le risque « filesystem éphémère Railway » (props 1, 22) **n'existe pas**. Le vrai risque est inversé : **gonflement de la base** (base64 = +33 %, 6 ans de photos dans Postgres → base lourde, dumps lents, perf dégradée).
- **Cookie de session** déjà `HttpOnly + SameSite=Lax + Secure(prod)` — la moitié de la prop 4 est faite. Manque : table sessions/révocation, bcrypt cost (actuellement **10**, demandé ≥12), rate-limiting, rôle figé 7j dans le cookie.
- **`/api/health`** existe déjà. **Notifications in-app** (cloche) existent déjà (`lib/notifications.ts`), mais **aucun email**.
- **Tests** déjà en place (auth, statut, permissions, validation) sous Vitest.
- **`.env` n'a jamais fuité** dans git (vérifié), `.env*` est gitignored.
- **Courbe d'évolution** dérivée à la volée de la table `Historique` (pas de snapshots) — fragile et incomplète.
- Confirmés tels quels : pas de `viewport` dans `layout.tsx`, input file sans `capture`/`multiple`, `FormProposition` sans état `enCours` ni paliers, `className="synth"` sans règle CSS correspondante, Nav en flex-wrap, pas d'OpenGraph public, `--orange-d: #cd5026`.

Fichiers de référence : `prisma/schema.prisma`, `src/lib/session.ts`, `src/lib/auth.ts`, `src/app/api/auth/login/route.ts`, `src/components/FormProposition.tsx`, `src/components/FormPieceJointe.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/components/Nav.tsx`, `src/app/public/page.tsx`, `src/lib/notifications.ts`.

---

## VAGUE 1 — Quick wins (fort impact / petit effort, < 1 jour chacun)

**1.1 — Backups Postgres externalisés (LA priorité, le code est sain mais les données ne sont pas sauvegardées)**
Créer un workflow GitHub Actions `schedule` (cron quotidien, gratuit) qui exécute `pg_dump` via `DATABASE_URL`, chiffre le dump (`age` ou `gpg`) et le pousse vers Backblaze B2 / Cloudflare R2. Rétention 7 quotidiens + 4 hebdo + 12 mensuels. **Tester une restauration immédiatement** (un backup non testé n'existe pas). Comme les pièces jointes sont en base, le dump SQL **les sauvegarde aussi** — un seul mécanisme couvre tout.
*Pourquoi : c'est le seul point qui viole « jamais de perte de données ». Railway ne garantit pas de backup. Le reste est secondaire tant que ceci n'est pas fait.*

**1.2 — Anti-double-soumission sur `FormProposition.tsx`**
Ajouter `const [enCours, setEnCours] = useState(false)`, désactiver le bouton pendant le `fetch`, libellé « Envoi en cours… » (copier le pattern déjà présent dans `FormPieceJointe`).
*Pourquoi : sur 4G de chantier, un double-tap crée deux propositions en file. Trivial, déjà résolu ailleurs dans le code.*

**1.3 — `viewport` + safe-area dans `layout.tsx`**
Ajouter `export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }` et utiliser `env(safe-area-inset-*)` pour la future barre d'action basse.
*Pourquoi : sans ça, rendu mobile imprévisible et boutons bas masqués par l'encoche iPhone.*

**1.4 — Capture caméra directe + multi-photos dans `FormPieceJointe.tsx`**
Ajouter un second input dédié `accept="image/*" capture="environment" multiple`, et boucler `envoyerFichier` sur chaque fichier. Garder l'input multi-type existant pour les documents.
*Pourquoi : l'élu sur chantier ouvre l'appareil photo en 1 tap au lieu de naviguer dans la galerie. La compression canvas existe déjà.*

**1.5 — Paliers tactiles sur le slider d'avancement (`FormProposition.tsx`)**
Ajouter une rangée de gros boutons 0/25/50/75/100 (hauteur ≥44px) + boutons −5/+5, **en complément** du slider.
*Pourquoi : viser une valeur précise au pouce est dur pour les élus peu numériques.*

**1.6 — Corriger la grille morte du dashboard (`globals.css`)**
Ajouter la vraie règle `.synth { display:grid; gap:16px; } @media(max-width:680px){ .synth{grid-template-columns:1fr} }` et passer la sous-grille des 4 axes (`'1fr 1fr'` inline dans `page.tsx`) en 1 colonne sous ~480px. Retirer/ajuster le `marginTop:-34` qui risque le chevauchement.
*Pourquoi : aujourd'hui `className="synth"` ne correspond à aucune CSS → dashboard tassé sur mobile.*

**1.7 — Token « orange accessible » pour le texte (RGAA)**
`#EE6B3E` = ~3:1 sur blanc, échec AA (4,5:1). Ajouter une variable `--orange-texte: #C24A1E` (~4,7:1) et l'utiliser pour **tout texte/lien/libellé orange**. Garder `#EE6B3E` réservé aux aplats et remplissages de jauge. (Note : `--orange-d: #cd5026` existe déjà mais reste limite, ~4,2:1 — préférer `#C24A1E`.)
*Pourquoi : fait mesurable, responsabilité juridique vis-à-vis de 8000 habitants, coût quasi nul.*

**1.8 — Statuts non basés sur la seule couleur**
Dans `BadgeStatut.tsx` et les jauges : ajouter pour chaque statut une icône/forme distincte + libellé texte (Terminé ✓ / En cours / En retard ⚠ / Non démarré). Mettre `role="img"` + `aria-label="Avancement : 60 %, en cours"` sur les SVG de jauge, et afficher le % en chiffre foncé (#1A1A1A) au centre.
*Pourquoi : daltoniens, lecteurs d'écran, impression N&B des bilans.*

**1.9 — Bandeau séparation politique/mairie + mentions légales**
Footer permanent sur toutes les pages publiques : « Site édité par le groupe Seyssins Nature & Solidaire — ce n'est pas un site officiel de la commune de Seyssins. » + page mentions légales (responsable de traitement = le groupe, pas la commune) + lien politique de confidentialité.
*Pourquoi : risque juridique/politique majeur, effort faible.*

**1.10 — Sanitization du contenu libre publié**
Auditer le rendu des champs texte libres (`journal`, `commentaire`, `legende`) en vue publique. S'assurer qu'ils sont rendus en texte brut (React échappe par défaut — vérifier qu'aucun `dangerouslySetInnerHTML` n'est utilisé). Aucune dépendance si pas de markdown.
*Pourquoi : angle mort du panel — XSS stocké / contenu publié à 8000 habitants.*

---

## VAGUE 2 — Améliorations majeures (fort impact, effort moyen)

**2.1 — Durcissement auth : sessions révocables + rate-limit + bcrypt 12**
- Passer `bcrypt.hash(clair, 12)` dans `auth.ts`.
- Rate-limiting sur `/api/auth/login` (compteur par IP/email en base ou en mémoire, verrouillage après N échecs) — 22 comptes connus = cibles brute-force.
- Remplacer le cookie JWT auto-portant par une **table `Session`** (id opaque en base) → permet de déconnecter immédiatement un élu sortant / compte compromis, et de ne plus figer le rôle 7 jours. Re-lire `role` et `actif` à chaque requête côté serveur.
*Pourquoi : auth maison sur 6 ans = surface de risque ; aujourd'hui changer un rôle ou désactiver un compte ne prend effet qu'après expiration du cookie (7j).*

**2.2 — Flux « saisie terrain » mobile en 2 gestes + brouillon hors-ligne**
Barre d'action sticky en bas de la fiche mesure mobile (`safe-area`), bouton géant orange « Mettre à jour cette mesure » → mini-formulaire 3 questions (paliers % / commentaire / photo via caméra directe). Sauvegarde auto du brouillon en `localStorage`/IndexedDB à chaque frappe (« Brouillon enregistré »), retry à la reconnexion (« Pas de réseau, votre saisie est gardée »). Compression photo abaissée pour le terrain (`maxLargeur 1080`, `qualite 0.6`). Confirmation franche après envoi.
*Pourquoi : cœur de l'adoption. Sans saisie terrain facile, l'outil meurt de données vides et tout le reste (vue publique, bilan, digests) s'effondre. Fusionne props 3, 8, 15, 16, 29, 37, 48, 49, 50, 69.*

**2.3 — Page d'accueil élu « Mes mesures »**
Au login d'un ELU : atterrir sur SES mesures (référent/adjoint/co-référent) en grosses cartes triées par urgence (retard en haut), % actuel + bouton direct « Mettre à jour », + ligne « X propositions validées / Y refusées — voir pourquoi ». Vocabulaire sans jargon (« proposé 60 %, en attente de l'accord d'un admin » au lieu de « EN_ATTENTE »).
*Pourquoi : les élus ne doivent pas chercher dans 67 mesures avec filtres. Fusionne props 13, 38, 51, 52, 77.*

**2.4 — Menu mobile compact (`Nav.tsx`)**
Sous ~640px, `<details>/<summary>` natif (sans dépendance) regroupant les liens en liste verticale d'items ≥44px, avec état actif et badge « À valider » visible.
*Pourquoi : aujourd'hui flex-wrap → 3-4 lignes de liens minuscules sur mobile.*

**2.5 — Notifications email transactionnelles (Resend/Brevo free)**
3 triggers branchés sur le circuit existant : (1) admin → nouvelle proposition, (2) élu → sa proposition validée/refusée (avec motif), (3) digest hebdo optionnel. Champ booléen de préférence par compte (RGPD/désabonnement). Flag `notified_at` sur la proposition pour l'idempotence (anti-retry Railway).
*Pourquoi : ferme la boucle de feedback ; sans email, les élus ne savent pas qu'on attend une action. Fusionne props 31, 54, 67, 71.*

**2.6 — Table de snapshots + courbe d'évolution honnête**
Créer une table `SnapshotAvancement` (date, axe/global, pourcent) alimentée par un cron hebdo/mensuel (le même GitHub Actions). Faire pointer `CourbeEvolution` dessus plutôt que sur la dérivation à la volée de `Historique`. Ajouter marqueur mi-mandat 2029 + ligne cible. Mettre en cache les agrégats du dashboard (`unstable_cache`/`revalidate`).
*Pourquoi : la courbe actuelle se reconstruit depuis l'historique des validations = incomplète et coûteuse. Prérequis de toute viz temporelle (props 66, 85). Fusionne 6, 85.*

**2.7 — Vue publique « habitant » narrative + fraîcheur + OpenGraph**
Refondre `public/page.tsx` : en-tête jauge globale + phrase synthèse (« 41 des 67 engagements en cours ou tenus »), 4 axes en cartes avec mesures phares, liste exhaustive plus bas. Ajouter « Données arrêtées au JJ/MM », badge « mis à jour il y a X jours » par mesure, légende des statuts/méthode (% déclaratif). Ajouter `generateMetadata` avec OpenGraph (`next/og`, inclus) pour partage propre. URL partageable par mesure.
*Pourquoi : la vue publique doit être une page de com', pas une copie du back-office. Fusionne props 10, 34, 41, 44, 60, 61, 62, 65, 78, 89.*

**2.8 — Soft-delete + journal d'audit admin (anti-perte de données)**
Remplacer toute suppression dure par `deletedAt` (corbeille restaurable 30j). Audit log horodaté des actions admin sensibles (édition mesure, désactivation compte, changement de référent, dépublication) avec auteur. Export complet JSON déclenchable par l'admin (archive annuelle hors Railway).
*Pourquoi : renforce « jamais de perte de données » au-delà de l'historique de validation. Fusionne props 33, 58.*

**2.9 — Pilotage admin : risques, relances, vue par référent (ADMIN uniquement)**
Panneau « À surveiller » : mesures en retard, sans MAJ depuis N jours, sans référent, bloquées. Matrice élu × axe × statut. Bouton « Relancer le référent ». **Toute cette richesse reste dans l'espace ADMIN** — jamais dans le parcours élu (règle directrice : complexité pour 2 admins, simplicité pour 21 élus). Pas de leaderboard public (poison politique).
*Pourquoi : pilotage réel sans polluer l'UX des élus. Fusionne props 30, 56, 57, 87 ; abandonne les badges de la 68.*

---

## VAGUE 3 — Ambitieux ou optionnel

**3.1 — Mode présentation / réunion** : vue plein écran vidéoprojecteur, une diapo par axe, grosses jauges, navigation flèches clavier, charte respectée. Utilisable depuis tablette/téléphone branché. Fusionne props 7, 43, 53, 70.

**3.2 — Bilan de mi-mandat figeable (snapshot daté)** : bouton qui fige l'état des 67 engagements à une date (« Bilan mi-mandat — mars 2029 »), page publique `/bilan/2029`, export PDF mis en page, comparaison de deux snapshots. Réutilise 2.6. Fusionne props 28, 73.

**3.3 — Migration des photos vers object storage (R2/B2)** : SI la base dépasse ~quelques Go, sortir `contenu` base64 de Postgres vers un bucket S3 (ne garder que clé + métadonnées + hash), liens signés courts pour le public. **À déclencher sur seuil mesuré, pas par principe** — aujourd'hui le stockage en base fonctionne et simplifie les backups.

**3.4 — 5e catégorie « Au-delà du programme »** : section visuelle distincte (teinte secondaire, pas l'orange), compteur propre, **exclue de la jauge globale des 67**, valorisée en vue publique. Fusionne props 14, 32, 45.

**3.5 — Environnement de staging Railway** + base distincte, migrations Prisma testées avant prod, auto-deploy prod sur `main` uniquement. Prop 23.

**3.6 — Domaine custom + monitoring** : domaine politique dédié (jamais .gouv.fr), UptimeRobot sur la vue publique + `/api/health` (déjà existant), alertes budget Railway. Props 24, 25.

**3.7 — Magic link / invitation par jeton** pour onboarding élus (réinit mot de passe, « dernière connexion », renvoyer invitation). Prop 59. *Ne PAS faire la 2FA email admin (trop fragile : si l'email tombe, l'admin ne peut plus se connecter en réunion).*

**3.8 — Photos avec personnes : case obligatoire à l'upload** « cette photo contient-elle des personnes reconnaissables ? » → si oui, **blocage de la publication publique** (reste en interne). Champ consentement/droit à l'image + modèle d'autorisation téléchargeable. **PAS de floutage automatique** (face-api en serverless = lourd, faux négatifs garantis, fausse assurance pire que rien). Partie saine des props 79, 80.

**3.9 — Politique de conservation RGPD** : désactivation + **anonymisation** du compte d'un élu **sortant du mandat** (email/hash purgés) tout en pseudonymisant ses contributions (« ancien élu référent »). ⚠️ Ne pas confondre avec un **changement de rôle** (zéro purge — cf. mémoire projet : rôle = filtre d'affichage). Props 4, 82.

---

## ❌ À NE PAS FAIRE (arbitrages tranchés)

- **Floutage automatique des visages** (79) : techniquement fragile, déresponsabilisant. Case déclarative + blocage manuel suffisent.
- **2FA email admin** (84) : dépendance email critique, risque de blocage en réunion. Magic link oui, 2FA non.
- **Carte de la commune par quartier** (74) : champ géo sur 67 mesures + composant carte à maintenir 6 ans, beaucoup de mesures sans quartier (RH, finances). ROI faible.
- **Badges de contribution / leaderboard** (68) : « poison en politique de groupe » de l'aveu de l'expert. Garder seulement « inactifs 30j » côté admin.
- **Panneau de réglages d'accessibilité persistants en base** (40) : sur-ingénierie pour 21 personnes. Faire `rem` + `prefers-reduced-motion` (gratuit), pas le stockage en base.
- **Object storage par principe** (1, 22) : le stockage en base fonctionne et simplifie les backups. Migrer seulement sur seuil de taille mesuré (3.3).

---

## 🎯 LES 5 PRIORITÉS ABSOLUES (à attaquer en premier, dans l'ordre)

1. **Backups Postgres externalisés et TESTÉS** (1.1) — GitHub Actions cron + `pg_dump` chiffré vers B2/R2, restauration vérifiée cette semaine. Seul point qui viole « jamais de perte de données ». Couvre aussi les photos (en base).
2. **Flux saisie terrain mobile 2 gestes + brouillon hors-ligne** (2.2, avec quick wins 1.4 capture caméra + 1.5 paliers + 1.2 anti-double-clic + 1.3 viewport) — condition n°1 de l'adoption par les 21 élus.
3. **Token orange accessible + statuts non-couleur** (1.7 + 1.8) — échec RGAA mesurable, responsabilité vis-à-vis de 8000 habitants, coût quasi nul.
4. **Bandeau séparation politique/mairie + mentions légales + sanitization** (1.9 + 1.10) — garde-fous juridiques indispensables avant toute exposition publique élargie.
5. **Durcissement auth : sessions révocables + rate-limit + bcrypt 12** (2.1) — auth maison sur 6 ans, et aujourd'hui désactiver un compte ne prend pas effet avant 7 jours.

**Angle mort à traiter hors-code, mais le plus mortel** : *qui maintient cet outil custom (Next 16 / Prisma 7) pendant 6 ans ?* Identifier un mainteneur (ou une stratégie de sortie : export complet + doc de migration) — sinon une faille de sécurité non patchée fera plus de dégâts que n'importe quel bug d'UI. Et **tester la saisie d'une mesure sur le terrain avec l'élu le moins à l'aise du groupe** : c'est le seul test d'accessibilité qui compte.

---

# DÉBAT CONTRADICTOIRE (intégral)

Voici ma critique contradictoire. Je tranche sans détour.

---

## 1. Les vrais consensus (à faire en priorité, sans débat)

Quatre clusters reviennent chez 4+ experts indépendants et concentrent l'impact. Ce sont vos non-négociables.

**A. Pérennité des données = la priorité absolue (propositions 1, 2, 21, 22, 28, 33, 73 + soft-delete 58).**
Quatre experts différents (dev, infra, gestion de projet, maire) disent la même chose : sur Railway, le filesystem est éphémère et les backups ne sont pas garantis. La contrainte « jamais de perte de données » est aujourd'hui **probablement déjà violée** si aucun volume persistant n'est monté et si les pièces jointes sont sur disque local. C'est le point le plus grave de tout le panel, et il est silencieux : personne ne s'en rend compte jusqu'au premier redeploy qui efface les photos de chantier. À traiter cette semaine, pas dans la roadmap.

**B. Saisie terrain mobile en 2 gestes + capture caméra directe + brouillon hors-ligne (3, 8, 15, 16, 29, 37, 48, 49, 50, 69).**
Sept experts convergent, dont l'élu usager lui-même. C'est le cœur de l'adoption : si les élus peu technophiles n'arrivent pas à saisir sur le terrain, l'outil meurt de données vides, et tout le reste (vue publique, bilan, digests) s'effondre faute de contenu.

**C. Contraste de la charte orange = échec RGAA avéré et chiffré (9, 35, 36, 90).**
Quatre experts donnent le même calcul : #EE6B3E = ~3:1, sous le seuil 4,5:1. Ce n'est pas une opinion, c'est un fait mesurable. La solution fait consensus : garder l'orange en aplat/jauge, créer un orange foncé dérivé (~#C0461F / #C24A1E) pour le texte. Coût quasi nul, risque juridique réel (vue publique = 8000 habitants, responsabilité du groupe).

**D. Séparation politique/institutionnel matérialisée (24, 47, 64, 81).**
Bandeau permanent « pas un site officiel », mentions légales, responsable de traitement = le groupe et non la commune, domaine jamais en .gouv.fr. Risque juridique et politique majeur, coût faible.

---

## 2. Les contradictions — et mes arbitrages

**Tension n°1 : Jauges circulaires (charte imposée) vs lisibilité comparative.**
Le data-viz (86) dit franchement que 4 jauges circulaires séparées ne permettent PAS de comparer 4 axes d'un coup d'œil, et propose des barres horizontales. La charte impose les jauges circulaires.
**Je tranche :** les deux ont raison sur des publics différents. Jauges circulaires en **vue publique** (identité de marque, une jauge à la fois, émotion). Barres horizontales empilées par statut en **dashboard admin** (pilotage, comparaison). Ce n'est pas une trahison de charte : on ajoute un outil de travail là où la charte sert la communication. Garder le orange.

**Tension n°2 : Simplicité radicale vs richesse fonctionnelle.**
L'élu usager et le maire veulent une page « Mes mesures » ultra-dépouillée et une saisie en 2 taps (48, 51, 69, 77). En face, on empile : matrice élu×axe (57), tableau de contribution (68), pilotage des risques (30, 56), carte par quartier (74), comparateur snapshots (28). Si tout ça atterrit dans la même UI, les élus peu technophiles décrochent.
**Je tranche :** **séparation stricte des deux mondes par rôle.** L'ELU ne voit QUE « Mes mesures » + saisie 2 taps. Toute la richesse analytique (matrices, classements, risques, quartiers) va dans l'**espace ADMIN uniquement**, jamais dans le parcours élu. La complexité est légitime pour 1-2 admins outillés ; elle est toxique pour 21 élus. C'est la règle directrice de tout le projet.

**Tension n°3 : « Jamais de perte de données » vs RGPD (durée de conservation limitée).**
Le RGPD (82) impose de purger ; la contrainte projet impose de tout garder. Contradiction frontale, et seul l'expert RGPD la voit clairement.
**Je tranche, et c'est important :** distinguer deux natures de données. (a) Le bilan de mandat + l'historique de validation = donnée de transparence politique, conservation légitime → on garde, **pseudonymisé** (« ancien élu référent »). (b) Les données de compte (email, mot de passe, session) d'un élu sortant = à purger/anonymiser. La proposition 4 qui veut une « purge sans casser l'historique inaltérable » et la proposition 82 sont la bonne synthèse. Attention : votre mémoire projet dit « rôle = filtre, jamais de perte au changement » — ne pas confondre changement de rôle (zéro purge) et départ du mandat (anonymisation du compte). Ce sont deux choses différentes.

**Tension n°4 (la plus risquée) : Floutage automatique des visages (79).**
C'est la seule proposition notée « gros » effort, et elle est techniquement fragile : face-api en serverless/Railway = lourd, lent, faux négatifs garantis (un visage raté = donnée personnelle publiée = exactement le risque qu'on prétend couvrir, avec une fausse assurance en plus).
**Je tranche : NON au floutage automatique.** Garder seulement la partie saine de 79+80 : à l'upload, une case obligatoire « cette photo contient-elle des personnes reconnaissables ? ». Si oui → interdiction de publication publique (la photo reste en interne). Le floutage, si vraiment voulu, se fait à la main avant upload. Une détection automatique qui rate 1 visage sur 10 est pire que pas de détection, parce qu'elle déresponsabilise.

---

## 3. Redondances à fusionner

Le panel est très répétitif. Concrètement, il n'y a pas 90 idées, il y en a environ une trentaine. À fusionner :

- **Backups/pérennité :** 1+22 (object storage pièces jointes) ; 2+21+33 (dumps PG externalisés) ; 28+73 (snapshot bilan figé). → **3 chantiers, pas 7.**
- **Saisie terrain mobile :** 3+8+15+16+29+37+48+49+50+69. → **1 seul chantier** « flux de saisie terrain ».
- **Contraste/accessibilité couleur :** 9+35+36+90. → **1 token system.**
- **Vue publique narrative :** 10+34+41+44+89 (narration/bilan) ; 60+61+66 (fraîcheur/méthode/évolution) ; 42+62+65+78 (Open Graph/partage). → **3 chantiers.**
- **Mode présentation réunion :** 7+43+53+70. → **1 chantier.**
- **Notifications email :** 31+54+67+71. → **1 chantier** (Resend/Brevo, 3 triggers + digest).
- **Pilotage admin (risques/relances/contribution) :** 30+56+57+68+87. → **1 chantier admin.**
- **Séparation politique :** 24+47+64+81. → **1 chantier** (mentions légales + bandeau + domaine).
- **5e catégorie :** 14+32+45. → **1 chantier.**
- **Onboarding élu :** 13+38+52+77. → fusionné dans le chantier saisie terrain.

---

## 4. Le « nice-to-have » à reléguer (franchement)

Vu le contexte — outil politique d'un groupe, budget quasi nul, 21 élus dont certains peu numériques, durée 6 ans, peu de bras pour maintenir — ces propositions sont des distractions :

- **74 — Carte de la commune par quartier.** Séduisant pour le maire, mais demande un champ géo sur 67 mesures + un composant carte à maintenir 6 ans. Beaucoup de mesures (RH, finances, démocratie) n'ont aucun quartier. ROI faible, dette de maintenance réelle. **Plus tard, voire jamais.**
- **68 — Tableau de contribution / badges.** L'expert lui-même prévient que c'est un « poison en politique de groupe ». En version badges qualitatifs c'est inoffensif mais inutile ; en version classement c'est dangereux. **Réduire à un simple « inactifs depuis 30j » côté admin (déjà dans 56). Abandonner les badges.**
- **40 — Réglages d'accessibilité persistants en base.** Le zoom navigateur natif + `rem` + `prefers-reduced-motion` couvrent 95% du besoin gratuitement. Stocker une préférence de taille de police en base pour 21 personnes = sur-ingénierie. **Faire les rem et reduced-motion (gratuit), pas le panneau en base.**
- **59 magic link / 84 2FA email.** Le magic link est un bon levier anti-friction. Mais la 2FA email sur les 2 comptes admin ajoute une dépendance email critique : si l'envoi email tombe, l'admin ne peut plus se connecter en réunion. **Magic link oui ; 2FA email admin = non, trop fragile pour le gain.**
- **66 + 85 courbes d'évolution riches** dépendent toutes deux des snapshots (6/85). Sans snapshots, pas de courbe honnête. **Prérequis avant tout travail de courbe : la table de snapshots. Sinon c'est du vent.**
- **6 — agrégats recalculés/cache.** Vrai sujet de perf, mais 8000 habitants ne tapent pas tous en même temps. Couvert plus simplement par l'ISR (27). **Fusionner dans 27, ne pas sur-investir.**

---

## 5. Ce qui MANQUE — et que personne n'a vu

C'est ici que le panel a des angles morts. Sept manques sérieux :

1. **Le bus factor humain, pas technique.** La proposition 26 parle d'accès partagés, mais personne ne pose LA vraie question : **qui maintient ce code dans 4 ans ?** Un outil custom Next.js 16 / Prisma 7 sans dev attitré sur 6 ans, c'est une bombe à retardement. Que se passe-t-il quand Next 16 est déprécié, qu'une faille de sécurité sort, et que le bénévole qui a tout codé est parti ? **Il manque un plan de soutenabilité : soit un mainteneur identifié et payé, soit une stratégie de sortie (export complet + docs) si l'outil doit être abandonné. Personne ne l'a dit, et c'est plus grave que n'importe quel bug d'UI.**

2. **La gouvernance éditoriale de la vue publique.** Beaucoup d'experts veulent publier (photos, limites, coûts, journal). Personne ne définit **qui décide politiquement de ce qui est rendu public**, ni comment on gère une crise (un habitant ou un opposant conteste un « 80% réalisé » manifestement faux). La 83 effleure la modération technique. Il manque une **règle politique** : validation collégiale avant publication d'un bilan, droit de réponse, gestion d'une contestation publique.

3. **La fiabilité/honnêteté des pourcentages.** La 61 demande d'expliquer que c'est déclaratif. Mais personne ne traite le **risque de crédibilité** : un % auto-déclaré par l'élu lui-même, validé par un admin du même groupe, affiché à 8000 habitants. C'est juge et partie. Au minimum il faut des **règles de calcul objectivables par statut** (ex. « Réalisé = délibération votée + chantier livré ») plutôt qu'un curseur subjectif, sinon le bilan est attaquable.

4. **Que se passe-t-il après 2032 / en cas de défaite électorale ?** L'outil est censé tenir 6 ans, mais que devient-il à la fin du mandat ? Archivage public définitif ? Extinction ? **La 28/73 figent un snapshot mais personne ne pense la fin de vie.**

5. **Modération des entrées libres = injection / contenu illicite.** Champs texte libres (journal, commentaires) publiés publiquement = surface XSS stockée et risque de contenu diffamatoire. La 5 teste les permissions, jamais l'échappement du contenu publié. **Manque : sanitization du HTML/markdown affiché côté public.**

6. **Rétention et coût réel du stockage photos sur 6 ans.** La 22 mentionne un quota, mais personne ne chiffre : 21 élus × photos de chantier × 6 ans peut dépasser les 10 Go gratuits de R2. **Manque : politique de cycle de vie réelle (résolution max, suppression des originaux après génération de la version publique).**

7. **Accessibilité réelle = test avec de vrais élus.** Toute la section RGAA est théorique. **Manque le seul test qui compte : faire saisir une mesure sur le terrain par l'élu le moins à l'aise du groupe, et regarder où il bloque.** Aucune proposition ne prévoit ce test utilisateur, alors que c'est la condition n°1 de succès.

---

## Verdict en une ligne

Le panel a raison sur **3 urgences absolues** (sauvegardes/pérennité, saisie terrain mobile 2 taps, contraste RGAA) et **2 garde-fous juridiques** (séparation politique, RGPD comptes). Il **sur-produit** sur le pilotage admin et la vue publique (à fusionner agressivement), se **trompe** sur le floutage auto et la 2FA email, et **oublie** le risque le plus mortel de tous : **qui maintient cet outil custom pendant 6 ans ?** Réglez d'abord les données et la maintenance humaine — le reste est secondaire.
