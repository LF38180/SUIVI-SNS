# Panel d'experts — Expérience MOBILE (par type d'utilisateur)

> 9 experts, 59 propositions. Les experts ont lu le code réel.
> Généré le 30 juin 2026.

---

# SYNTHÈSE FINALE

## MOBILE — ADMIN (Julie / Loïck en mobilité)

**[Vague 1] Remplacer `prompt()/confirm()/alert()` de la validation par un panneau inline tactile**
Quoi : dans `FileValidation.tsx`, supprimer `window.prompt()` (l.41, motif de refus), `window.confirm()` (l.51, validation groupée) et `alert()` (l.46). Pour le refus, déplier sous la carte un `<textarea>` pleine largeur avec `fontSize:16` (bloque le zoom auto iOS) + boutons « Confirmer le refus » / « Annuler » en `min-height:48px`. Pour la confirmation groupée, un bandeau in-app à la charte (`#EE6B3E`, Poppins). Garder la logique `fetch` et l'anti-double-clic `enCours`.
Pourquoi : c'est le **seul vrai bug de fiabilité** du lot — dans une WebView in-app (lien ouvert depuis Gmail/WhatsApp), `prompt()` est ignoré silencieusement : Julie croit avoir refusé, rien n'est parti. Consensus le plus massif du panel (cité 8 fois). NE PAS importer de lib de bottom-sheet animée : un panneau inline suffit et tient 6 ans.

**[Vague 1] Feedback visuel par bouton tapé**
Quoi : `traiter()` (l.38-47) pose `enCours=true` global → tous les boutons grisés sans retour sur le bouton cliqué. Afficher « Validation… » sur le bouton tapé et ne griser que la carte concernée.
Pourquoi : sur mobile lent, sans retour Julie retape → double action.

**[Vague 2] Validation groupée robuste au réseau faible**
Quoi : `validerSelection()` (l.49-59) boucle des `fetch` PATCH séquentiels **sans try/catch par item** ; si la 3e échoue, `router.refresh()` masque l'échec partiel. Ajouter un try/catch dans la boucle (continuer malgré un échec) + un récap final « 5 validées, 1 échec ». Ne PAS construire de machine à états avec reprise auto par item (sur-ingénierie pour 3-6 items entre deux réunions).
Pourquoi : sinon Julie croit avoir tout validé alors qu'une proposition est passée à la trappe.

**[Vague 2] Voir le justificatif photo dans la carte de validation**
Quoi : la carte n'expose que l'intitulé, l'ancien %, le % proposé et le commentaire. Ajouter dans `PropVue` (page.tsx) la/les pièces jointes et une vignette ouverte via simple `<a href={contenu} target="_blank">` (pas de lightbox maison).
Pourquoi : aujourd'hui Julie valide à l'aveugle ou doit quitter la file pour ouvrir `/mesures/[id]`.

**Rejeté : push web (#56)** — VAPID + web-push + abonnements en base + SW = gros effort fragile sur 6 ans pour 2 admins. La cloche par polling suffit.

---

## MOBILE — ÉLU (terrain, peu à l'aise avec le numérique)

**[Vague 1] Brouillon localStorage anti-perte de saisie**
Quoi : `FormProposition.tsx` ne garde `av`+`commentaire` qu'en `useState` ; le `catch` réseau (l.40) affiche un message mais **ne sauvegarde rien**. Persister `{av, commentaire}` dans `localStorage` (clé `sns-draft-<mesureId>`) à chaque frappe, restaurer au montage avec un bandeau « Brouillon restauré », nettoyer seulement sur `res.ok`. Bonus : écouteur `window 'online'` qui retente l'envoi.
Pourquoi : contrainte projet la plus dure (« jamais de perte de données ») ; chantier = 4G instable, appel entrant, écran verrouillé. ~15 lignes.

**[Vague 1] Bouton « 📷 Prendre une photo » (caméra directe) + choix multiple**
Quoi : `FormPieceJointe.tsx` (l.~116) a `accept="image/*,.pdf"` sans `capture` ni `multiple` et ne lit que `files?.[0]`. Ajouter DEUX boutons explicites ≥48px : « 📷 Prendre une photo » → input dédié `accept="image/*" capture="environment"` (ouvre la caméra arrière direct) ; « 🖼️ Choisir des photos » → input `multiple`. Boucler `envoyerFichier` sur `e.target.files` (compression canvas HEIC déjà compatible). Garder l'anti-double-envoi `enCours`.
Pourquoi : scénario cible n°1, cité **9 fois** (record du panel). L'input gris actuel n'est pas perçu comme un bouton par un élu peu technophile.

**[Vague 2] Compression dégradée vers une cible de poids**
Quoi : dans `compresser()`, baisser à 1024px / q0.6 et boucler la dégradation jusqu'à passer sous ~600 Ko ; afficher « Photo réduite à 380 Ko ».
Pourquoi : en upload 4G montant (<1 Mbps), une photo proche du plafond `MAX_BASE64=3Mo` prend 20-30 s. Vrai apport technique au-delà du simple attribut.

**[Vague 2] Confirmation visible + retour clair après envoi**
Quoi : après envoi, `scrollIntoView` vers un encadré succès vert pleine largeur + bouton « Retour à mes mesures ». Ajouter aussi un lien « ← Retour » optionnel dans `EnTete.tsx` (prop `retour`, cible 44px).
Pourquoi : page longue + `router.refresh()` qui ne repositionne pas → l'élu ne sait pas si ça a marché et ré-envoie. Fiche mesure = cul-de-sac sans lien retour.

**[Vague 3] CTA « Ajouter une photo » après l'envoi du %**
Quoi : après envoi du %, afficher un appel à l'action qui `scrollIntoView` vers le bloc pièce jointe.
Pourquoi : approche le « parcours 2 gestes » **sans** refonte data. **Rejeté : rattacher la photo à la proposition (#21)** — la pièce jointe est liée à la mesure ; refonte data-lourde et risquée vs « jamais de perte de données ».

---

## MOBILE — HABITANT (arrive par lien WhatsApp/Facebook, lecture 30 s)

**[Vague 1] Corriger l'ancre de partage `#mesure-X` (bug livré cassé)**
Quoi : le bouton Partager construit `/public#mesure-${m.id}` (PublicMesures.tsx l.81) mais la `div.card` (l.69) **n'a aucun `id`**. Ajouter `id={'mesure-'+m.id}` + `scroll-margin-top:80px` (compense la nav sticky). Bonus : `:target { box-shadow }` pour surligner.
Pourquoi : ce n'est pas une amélioration, c'est une **fonctionnalité déjà livrée qui ne marche pas** — l'habitant atterrit en haut de page. 2 lignes.

**[Vague 1] Métadonnées Open Graph + og:image sur la vue publique**
Quoi : aucun `openGraph` dans `src/app`. Ajouter un `generateMetadata()` (server, données déjà disponibles) dans `public/page.tsx` : `og:title = "Programme Seyssins Nature & Solidaire — X% tenu"`, `og:description = "{realisees} tenus, {enCours} en cours sur {total}"`, et une `og:image` 1200×630 générée via `next/og` (`ImageResponse`, intégré, gratuit) affichant la jauge orange + le % global.
Pourquoi : outil **politique** dont la finalité est la diffusion à 8000 habitants. Un lien nu sans titre ni visuel tue le partage avant même le clic.

**[Vague 2] Chips d'axe en scroll horizontal sticky + cibles 44px**
Quoi : les 5 chips d'axe (l.52-58) sont en `flex-wrap` → 2-3 lignes sur 360px, et non sticky (impossible de changer d'axe sans remonter). Passer en `overflow-x:auto; flex-nowrap` + `scroll-snap`, rendre la barre `position:sticky` sous la nav. `.chip` (globals.css l.134) → `min-height:44px`, texte 14px. Garder le wrap en desktop via media query.
Pourquoi : geste horizontal naturel au pouce ; chips actuels trop petits (~31px) et inaccessibles une fois descendu.

**[Vague 2] Hiérarchiser la synthèse pour une lecture en 30 s**
Quoi : titre court en haut de carte « X% du programme réalisé », puis « {realisees} tenus · {enCours} en cours · {restants} à venir » en chiffres contrastés ; la jauge sert d'illustration. Réduire le sous-titre orange d'`EnTete` en mobile.
Pourquoi : la « réponse » que cherche l'habitant n'est aujourd'hui visible que DANS la jauge.

---

## MOBILE — TRANSVERSE (tous)

**[Vague 1 — PRIORITÉ PERF] Sortir les photos du base64 SSR**
Quoi : `mesures/[id]/page.tsx` (l.13-28) fait `findUnique` avec `include:{piecesJointes}` chargeant tout le `contenu` base64, puis rend `<img src={p.contenu}>` inline (l.162-164). (1) Remplacer `include` par un `select` qui **exclut `contenu`** ; (2) créer une route `GET /api/pieces-jointes/[id]/image` renvoyant le binaire décodé (`Buffer.from(b64,'base64')`) avec `Content-Type` + `Cache-Control: public, max-age=31536000, immutable` ; (3) `<img src={'/api/pieces-jointes/'+p.id+'/image'} loading="lazy" decoding="async">`.
Pourquoi : une fiche à 5 photos = **~15 Mo de HTML SSR téléchargés avant le premier rendu**, sur la 4G d'un chantier. **De loin le plus gros levier réseau de l'app**, vu par un seul expert.

**[Vague 1] Corriger les contrastes (lecture plein soleil)**
Quoi : remplacer `#9A9AA0` (≈2,8:1 sur blanc) par `#6E6E73` partout (dates « mis à jour », numérotation, % barré, dates du fil), et utiliser `--orange-texte:#C0461F` (déjà défini) partout où l'orange sert de **texte** (titres de rubrique, labels d'axe). Foncer les fonds de badges de statut pour tenir 4.5:1 avec le blanc, ou monter le libellé à 12,5px+.
Pourquoi : échec WCAG 1.4.4 ; illisible en plein soleil sur un chantier. Noté **critique**.

**[Vague 1] Compacter l'en-tête orange en mobile**
Quoi : `EnTete.tsx` est en tailles fixes (h1 25px, marque 30px, padding 30/34px), **aucune media query** ; la carte synthèse remonte en `marginTop:-34` codé en dur. Ajouter une media query 760px (cohérente avec l'existant) : `h1 clamp(19px,5.5vw,25px)`, marque `clamp(24px,7vw,30px)`, padding réduit, et rendre le `-34` cohérent.
Pourquoi : sur 360px de haut, le header mange le premier viewport avant tout contenu actionnable. Bénéficie aux 3 profils.

**[Vague 2] Auto-héberger Poppins via `next/font`**
Quoi : remplacer le `@import url('fonts.googleapis.com...')` (globals.css l.1) par `next/font/google` (subsets latin, poids 400/500/600/700 réellement utilisés).
Pourquoi : un `@import` est render-blocking + dépendance à un domaine tiers sur 6 ans ; `next/font` auto-héberge et applique `font-display:swap`.

**[Vague 2] Anti-débordement horizontal**
Quoi : `overflow-wrap:break-word` sur `.card` et conteneurs de texte, `min-width:0` sur les enfants flex de texte (ex. intitulé `flex:1` ListeMesures l.134), `overflow-x:hidden` de sécurité sur `body`.
Pourquoi : un mot long / URL collée dans un commentaire crée un scroll horizontal global.

**[Vague 2] Filtres internes pleine largeur ≥44px en mobile**
Quoi : `ListeMesures.tsx` recherche + 3 `<select>` en `flex-wrap` → colonnes bancales sur 360px. Sous 760px : `<select>` en pleine largeur (1 par ligne), `min-height:44px`. Garder le `<select>` natif (bon picker mobile au pouce) — ne PAS construire de « bouton Filtres » custom.
Pourquoi : sélecteurs serrés et difficiles à viser.

**[Vague 3] Jauge responsive**
Quoi : `Jauge.tsx` figée à `taille=138` / chiffre 32px (accepte déjà une prop `taille`). Passer en `clamp(96px,28vw,138px)`, chiffre `clamp(22px,7vw,32px)` ; sous 480px empiler la jauge au-dessus de la phrase narrative.
Pourquoi : sur 360px la jauge mange ~40% de la largeur et écrase la légende. Respecte les ronds imposés par la charte.

**[Vague 3] Supprimer le dark mode mort**
Quoi : `page.module.css` est le boilerplate Next ; le bloc `@media (prefers-color-scheme: dark)` (l.126) réécrit `--background/--foreground` en noir. Le vider/supprimer.
Pourquoi : risque de fond noir sur mobile en mode sombre, contre la charte beige `#FAF7F4`.

**Rejeté transverse : service worker offline (#44/57)** — un SW mal versionné peut **servir un avancement périmé** aux 8000 habitants (contre « pas d'altération de donnée ») ; source de bugs subtils à maintenir 6 ans. Manifest+icônes (#54) et shortcuts (#59) = confort « vraie app », **non prioritaires**.

---

## LES 5 PRIORITÉS MOBILE ABSOLUES

1. **[ÉLU] Brouillon localStorage anti-perte** (`FormProposition.tsx`) — la contrainte projet la plus dure (« jamais de perte de données »), ~15 lignes. Vague 1.
2. **[ADMIN] Remplacer prompt/confirm/alert par panneau inline tactile** (`FileValidation.tsx`) — seul vrai bug de fiabilité (WebView in-app bloque `prompt()` silencieusement), consensus 8×. Vague 1.
3. **[ÉLU] Bouton « 📷 Prendre une photo » caméra directe + multiple** (`FormPieceJointe.tsx`) — scénario cible n°1, cité 9×, simple. Vague 1.
4. **[TRANSVERSE/PERF] Sortir les photos du base64 SSR** (`mesures/[id]/page.tsx` + route image) — ~15 Mo avant premier rendu sur 4G de chantier, plus gros levier réseau. Vague 1.
5. **[HABITANT] Corriger l'ancre `#mesure-X` (2 lignes) + Open Graph/og:image** (`PublicMesures.tsx`, `public/page.tsx`) — fonctionnalité de partage livrée cassée + diffusion politique à 8000 habitants qui dépend de l'aperçu du lien. Vague 1.

---

# DÉBAT CONTRADICTOIRE (intégral)

Confirmé : l'image est `findUnique` avec `include` complet du `contenu` base64, rendu `<img src={p.contenu}>` inline en SSR (l.162-164). La proposition #41 est factuellement exacte et c'est bien le plus gros levier réseau. J'ai assez de matière pour trancher.

---

# Débat tranché — Expérience mobile, app SNS

J'ai relu le code réel (FileValidation, FormProposition, FormPieceJointe, EnTete, Jauge, layout, globals.css, mesures/[id], public, PublicMesures). Verdict ci-dessous, organisé par ce qui compte vraiment, par profil. Les propositions sont citées par leur numéro.

## 1. Consensus forts (plusieurs experts indépendants → à faire, peu de débat)

**A. Remplacer `prompt()/confirm()/alert()` de la validation (ADMIN).** Cité 8 fois (#1, 9, 18, 25, 27, 40, 50 + composante de 30). C'est le consensus le plus massif du panel, et il est **factuellement justifié** : `FileValidation.tsx` l.41 utilise `prompt()` pour le motif de refus, l.51 `confirm()`, l.46 `alert()`. Le point dur que tout le monde a raison de souligner : dans une WebView in-app (lien ouvert depuis Gmail/WhatsApp), `prompt()` peut être ignoré silencieusement → Julie croit avoir refusé, rien n'est parti. **Tranche : à faire, c'est le seul bug de fiabilité réel et non cosmétique du lot.** Un panneau qui se déplie sous la carte avec `<textarea fontSize:16>` (anti-zoom iOS) + boutons 44px. NE PAS sur-construire une « bottom-sheet glissée du bas » animée (cf. §4 gadget) — un panneau inline suffit et tient 6 ans.

**B. Capture caméra + multiple sur les pièces jointes (ÉLU).** Cité **9 fois** (#3, 7, 17, 20, 32, 39, 42, 47, 58). Record absolu du panel. Confirmé : `FormPieceJointe.tsx` l.~116 a `accept="image/*,.pdf"` sans `capture` ni `multiple`, et ne lit que `files?.[0]`. C'est le scénario cible (« élu sur chantier »). **Tranche : à faire**, mais voir §2-tension sur le périmètre exact (le débat n'est pas *si* mais *jusqu'où*).

**C. Brouillon localStorage de la proposition (ÉLU).** Cité 4 fois (#6, 22, 43, 55), dont une notée **critique**. Confirmé : `FormProposition` ne garde `av`+`commentaire` qu'en `useState`, le `catch` réseau (l.40) affiche un message mais **ne sauvegarde rien**. Or la mémoire projet impose « jamais de perte de données ». **Tranche : à faire**, c'est un filet ~15 lignes aligné sur la contrainte la plus dure du projet.

**D. Compacter l'en-tête orange en mobile.** Cité 3 fois (#8, 31, 49). Confirmé : `EnTete.tsx` est en tailles fixes (h1 25px, marque 30px, padding 30/34px), **aucune media query**, et la carte synthèse remonte en `marginTop:-34` codé en dur. Sur un écran de 360px de haut, le header mange le premier viewport avant tout contenu actionnable. **Tranche : à faire**, petit effort, bénéficie aux 3 profils.

## 2. Tensions / contradictions → je tranche

**Tension 1 — Richesse admin vs effort, sur la robustesse réseau de la validation groupée.**
#29 (état par item, reprise des seules échouées) vs #30 (juste un spinner par bouton) vs le simple #1. La boucle `validerSelection()` (l.49-59) fait des `fetch` séquentiels **sans try/catch par item** : si la 3e échoue, Julie croit avoir tout validé. C'est un vrai trou.
**Tranche :** faire #30 (feedback par bouton tapé, trivial) **et** la version *minimale* de #29 : un try/catch dans la boucle + un récap final « 5 validées, 1 échec ». La « reprise automatique sur les seules échouées » avec état machine par proposition = **trop pour le contexte** (Julie valide 3-6 items entre deux réunions, pas 50). Garder simple.

**Tension 2 — « 2 gestes terrain » : fusionner photo+% (#21) vs les laisser séparés.**
#21 veut rattacher la photo à la *proposition* et l'envoyer avec le %. Séduisant UX, mais ça implique une **refonte du modèle de données** (la pièce jointe est aujourd'hui liée à la *mesure*, pas à la proposition) — donc risque sur « jamais de perte de données » et coût élevé.
**Tranche :** rejeter la refonte data. Retenir seulement le repli proposé par #21 lui-même : après envoi du %, afficher un CTA « Ajouter une photo » qui `scrollIntoView` vers le bloc pièce jointe. Le « parcours 2 gestes » parfait n'est pas finançable ici.

**Tension 3 — PWA complète vs effort/6 ans/budget nul.** C'est LE clivage du panel (#44, 54, 56, 57, 59).
- **Manifest + icônes + apple-touch-icon (#54)** : effort moyen, zéro maintenance, donne la « vraie app » sur l'écran d'accueil. Confirmé qu'il n'existe rien (`public/` n'a que les SVG Next par défaut, `layout.tsx` n'a ni themeColor ni appleWebApp). **Tranche : à faire** — mais c'est cosmétique/confort, **pas prioritaire** sur A/B/C/E.
- **Push réel (#56)** : VAPID + web-push + abonnements en base + SW. Sur iOS le push n'existe **que** pour une PWA installée. C'est **gros effort, dépendances, surface de panne sur 6 ans**, pour un groupe de 2 admins. **Tranche : NON.** La cloche par polling (Cloche.tsx) suffit largement pour 2 personnes. Gadget vu le contexte.
- **Service worker offline (#44, 57)** : tentant pour la vue publique (lecture pure, quelques Ko). Mais un SW mal versionné = risque de **servir un avancement périmé** aux 8000 habitants — exactement ce que la contrainte « pas d'altération de donnée » interdit, et #57 le reconnaît lui-même. Sur Next 16 c'est une source de bugs subtils à maintenir 6 ans. **Tranche : reporter / NON par défaut.** Le bénéfice (relire hors-ligne un bilan) est marginal face au risque.

**Tension 4 — charte (jauge ronde figée 138px) vs lisibilité petit écran (#48).**
La Jauge est figée à `taille=138`, chiffre 32px, mais accepte déjà une prop `taille`. Sur la vue publique à 360px, jauge + phrase narrative (`minWidth:220`) cohabitent mal.
**Tranche :** pas de conflit réel avec la charte — passer la jauge en `clamp()` ou prop réduite en mobile **respecte** les ronds imposés. Faire la version légère de #48 (taille responsive + sur <480px empiler la jauge au-dessus de la phrase). Petit effort.

## 3. Redondances à fusionner

- **prompt/confirm/alert** : #1=9=18=25=27=40=50 → **une seule tâche** (panneau inline + textarea 16px), avec le feedback par bouton de #30 et le try/catch de #29 intégrés.
- **capture/multiple photo** : #3=7=17=20=32=39=47=58 → **une seule tâche**. Pépites à conserver dans la fusion : deux boutons explicites « 📷 Prendre une photo » / « 🖼️ Choisir » (#20, #47 — un élu peu technophile ne comprend pas l'input gris actuel), libellés ≥48px (#47), et la **dégradation de compression de #46** (cibler ~600 Ko, q0.6/1024px) qui est le vrai apport technique au-delà du simple attribut.
- **brouillon local** : #6=22=43=55 → **une seule tâche**, avec bandeau « Brouillon restauré » + nettoyage sur `res.ok` + écouteur `online` (#55) en bonus.
- **en-tête compact** : #8=31=49 → **une seule tâche** (media query 760px + clamp h1/marque + réduire le `-34`).
- **filtres tactiles** : #4=10=51 (interne) et #36=37 (public) → **deux tâches** (interne / public) ; cœur commun = selects pleine largeur ≥44px en mobile, chips en scroll horizontal sticky côté public.
- **scrollIntoView confirmation** : #6=23=53 → fusionner dans la tâche FormProposition.

## 4. Gadgets vu le contexte (élus peu numériques, 6 ans, budget 0)

- **Push web (#56)** — déjà tranché NON. Le plus coûteux/fragile du lot pour 2 utilisateurs.
- **Service worker offline (#44/57)** — risque > bénéfice, NON par défaut.
- **« Bottom-sheet glissée du bas » animée (#1, #2, #33)** — la *fonction* (sortir du prompt natif, action à portée de pouce) est bonne ; l'**animation drawer** est du gadget. Un panneau inline + une barre `position:sticky;bottom:0` suffisent. Ne pas importer de lib de sheet.
- **Refonte photo↔proposition (#21)** — gadget data-lourd, déjà rejeté.
- **Shortcuts d'app / share entrant (#59)** — sympa, zéro priorité ; à faire en 5 min *si et seulement si* le manifest #54 est fait, sinon ignorer.
- **Lightbox plein écran maison pour les photos (#28, #52)** — un simple `<a href={contenu} target="_blank">` (mentionné en repli par #52) suffit ; pas de composant lightbox.

## 5. Angles morts mobile que personne n'a vraiment vus

1. **Le vrai problème de perf mobile n'est PAS la police ni le SW : c'est le base64 des photos en SSR (#41).** Confirmé dans le code : `mesures/[id]/page.tsx` fait `findUnique` avec `include:{piecesJointes}` **chargeant tout le `contenu` base64**, puis rend `<img src={p.contenu}>` inline (l.162-164). Une fiche à 5 photos = ~15 Mo de HTML SSR téléchargés **avant le premier rendu**, sur la 4G d'un chantier. C'est de loin le plus gros levier réseau et **un seul expert l'a vu**. **Devrait être tout en haut de la priorité « perf »** : `select` excluant `contenu` + route `/api/pieces-jointes/[id]/image` + `<img loading="lazy">`. (Effort moyen, mais impact réseau >> tout le reste.)
2. **Bug d'ancre de partage public (#35).** Confirmé : le bouton Partager construit `/public#mesure-${m.id}` (l.81) mais la `div.card` (l.69) **n'a aucun `id`**. Tout habitant qui reçoit un lien d'engagement précis atterrit en haut de page. C'est un **bug cassé**, pas une amélioration — 2 lignes (`id` + `scroll-margin-top`). Personne n'en a fait un « critique » alors que la fonctionnalité partage est déjà livrée et ne marche pas.
3. **Open Graph absent (#34).** Confirmé : zéro `openGraph` dans `src/app`. Pour un **outil politique** dont le but est la diffusion à 8000 habitants via WhatsApp/Facebook, un lien nu sans titre ni image tue le partage. C'est noté critique à juste titre et c'est spécifiquement *mobile-social*. Faisable avec `next/og` (intégré, gratuit). Angle « politique » que seuls 1-2 experts relient à la finalité réelle de l'app.
4. **Le `<select>` natif est en réalité un bon choix mobile** — plusieurs experts veulent les remplacer/replier ; or sur mobile le select natif ouvre le picker système, parfait au pouce. Le seul vrai défaut est la hauteur (<44px) et la largeur. Ne pas sur-ingénierer un « bouton Filtres dépliable » custom.
5. **`prefers-color-scheme: dark` mort dans `page.module.css` (#13).** Confirmé l.126. Risque réel : si une classe est réutilisée, fond noir sur mobile en mode sombre, contre la charte beige. Trivial à supprimer, vrai filet.
6. **`@import` Google Fonts render-blocking (#45).** Confirmé l.1 de globals.css. Sur 4G faible, texte retardé + dépendance à un domaine tiers sur 6 ans. `next/font` auto-héberge. Petit effort, bénéfice réel et durable.

## Verdict par profil — priorités

**ADMIN mobile (Julie/Loïck) :**
1. Remplacer prompt/confirm/alert par panneau inline (#1 fusionné, fiabilité = bug réel)
2. try/catch + récap dans la validation groupée (#29 minimal) + feedback bouton (#30)
3. Voir le justificatif photo dans la carte de validation (#28, *via simple lien*, pas lightbox)
- *Rejeté :* push (#56).

**ÉLU mobile (terrain, peu numérique) :**
1. Brouillon localStorage anti-perte (#22 fusionné — la contrainte projet la plus dure)
2. Bouton « 📷 Prendre une photo » capture=environment + multiple + compression dégradée (#7/20/46 fusionnés)
3. scrollIntoView + encadré succès + lien « Retour à mes mesures » (#23) et lien retour dans EnTete (#24)
- *Rejeté :* fusion data photo↔proposition (#21).

**HABITANT mobile (lien WhatsApp, 30 s) :**
1. **Open Graph + og:image** (#34) — détermine si le lien est même cliqué
2. **Fixer l'ancre `#mesure-X`** (#35) — bug livré cassé
3. Chips d'axe en scroll horizontal sticky (#36) + cibles 44px (#37) + hiérarchie « X% réalisé » en haut (#38)

**TOUS / transverse, par impact :**
1. **Sortir les photos du base64 SSR (#41)** — plus gros levier perf, sous-estimé par le panel
2. Contrastes : `#9A9AA0`→`#6E6E73`, orange-texte→`#C0461F` déjà défini (#15, critique, lecture plein soleil)
3. Compacter EnTete mobile (#8 fusionné), `next/font` (#45), supprimer dark mode mort (#13)
4. Jauge responsive clamp (#48), `overflow-wrap`/`min-width:0` anti-débordement (#11)

Fichiers concernés (absolus) : `/Users/loickferrucci/Desktop/suivi-sns/src/components/FileValidation.tsx`, `/components/FormProposition.tsx`, `/components/FormPieceJointe.tsx`, `/components/EnTete.tsx`, `/components/Jauge.tsx`, `/components/PublicMesures.tsx`, `/app/mesures/[id]/page.tsx`, `/app/public/page.tsx`, `/app/globals.css`, `/app/page.module.css`, `/app/layout.tsx`.
