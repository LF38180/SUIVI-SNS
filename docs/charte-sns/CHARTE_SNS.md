# CHARTE GRAPHIQUE — SEYSSINS NATURE & SOLIDAIRE (SNS)
## Spécification complète pour génération automatique de visuels
Version 1.0 — 14 juillet 2026. Toutes les valeurs sont exactes (mesurées sur les visuels de référence).

---

## 1. COULEURS (valeurs exactes, aucune autre couleur autorisée)

| Token | Hex | Usage |
|---|---|---|
| `--sns-orange` | `#EE6B3E` | Couleur principale : fonds pleins (couverture/clôture), bandeau haut, titres ligne 2, soulignements, dots, barres d'accent, blocs message clé |
| `--sns-cream` | `#FAF7F4` | Fond des vignettes intérieures et documents |
| `--sns-dark` | `#232326` | Texte principal, titres ligne 1, bandeau "message fort" foncé |
| `--sns-gray` | `#6E6E73` | Textes secondaires, sous-titre du logo, labels |
| `--sns-white` | `#FFFFFF` | Cartes, texte sur orange, badges |
| `--sns-green` | `#478D4C` | Uniquement indicateurs positifs (▲ hausse recettes / ▼ baisse dépenses) |

Blanc translucide sur fond orange : texte secondaire `rgba(255,255,255,.88–.95)`, arcs décoratifs `rgba(255,255,255,.5–.55)`.
Ombre des cartes : `0 4px 18px rgba(35,35,38,.05)`.

## 2. TYPOGRAPHIE

- **Vignettes réseaux sociaux : Poppins** (Google Fonts), poids 400 / 500 / 600 / 700. Antialiasing activé (`-webkit-font-smoothing:antialiased`).
- **Documents (communiqués, courriers) : Helvetica.**
- Interlignes : titres 1.05–1.12 ; paragraphes 1.38–1.42.
- Letter-spacing : titres −1 à −1.5px ; gros chiffres −1.5 à −4px.

## 3. LOGO TYPOGRAPHIQUE (jamais d'image, jamais le logo de la ville)

Deux lignes de texte :
```
Seyssins            ← Poppins 700, 46px (48px sur fond orange), letter-spacing -1px
Nature&Solidaire    ← Poppins 400, 22px (23px sur fond orange)
```
Variantes :
- **Sur fond clair** : "Seyssins" en #EE6B3E, "Nature&Solidaire" en #6E6E73 (un seul ton gris — rendu de référence des vignettes).
- **Sur fond orange** : tout blanc ("Nature&Solidaire" en rgba(255,255,255,.88)).
- Variante bicolore documents : "Seyssins" orange, "Nature"/"Solidaire" noir, "&" orange.
- Position : coin haut-gauche, line-height 1.04–1.05.

⚠️ **RÈGLE ABSOLUE : ne JAMAIS utiliser le logo officiel de la ville de Seyssins sur un document politique SNS.**

## 4. VIGNETTES RÉSEAUX — GABARIT 1080 × 1080 px

### Constantes de mise en page
- Marge de contenu : **80 px** gauche/droite ; padding haut ~60 px (78 px sur fonds orange) ; réserve basse 92 px (pour les dots).
- **Bandeau orange 14 px** pleine largeur en haut — vignettes intérieures UNIQUEMENT (pas sur couverture/clôture).
- **Titre** : Poppins 700, 52–56 px, interligne 1.05–1.12. Titres sur 2 lignes bicolores : ligne 1 en #232326, ligne 2 en #EE6B3E.
- **Soulignement du titre** : rectangle orange **220 × 8 px**, rayon 4 px, 16 px sous le titre.
- **Pagination** : dots centrés en bas, centre à ~y 1021. Ø 13 px, entraxe 29 px (gap 16 px). Dot actif plein, inactifs anneau 2 px. Orange sur fond clair, blancs sur fond orange. **Jamais chevauchés par le contenu. Pas de dots sur la clôture.**
- **Cartes blanches** : fond #FFF, rayon 18 px, ombre douce, **barre d'accent orange verticale 6 px** (rayon 3 px) à gauche, séparée par un gap de 14 px.
- **Blocs "message clé"** : fond orange plein, rayon 24 px (18 px pour bandeau court), texte blanc gras centré 26–40 px.
- **Bandeau "message fort" alternatif** : fond #232326, texte blanc 700, 26 px, une seule ligne.
- **Indicateurs +/-** : #478D4C, 25px 600, symbole ▲ ou ▼, posés à côté du montant (baseline alignée), mention "en un an" en 400.
- **Gros chiffre héro** : orange 700, jusqu'à 150 px, légende dessous en #232326 38px.
- **Badge (date du conseil)** : pastille blanche border-radius 999px, padding 15/30, texte orange 19px 600, letter-spacing 1.2px, MAJUSCULES.

### Types de vignettes
1. **Couverture** — fond orange plein ; 2 arcs décoratifs blancs (cercles bordure 2px rgba(255,255,255,.55), Ø ~520 et ~340 px) confinés en HAUT-DROITE et débordant du cadre ; logo blanc ; badge blanc (date) ; titre blanc 80px 700 ; accroche 33px rgba(255,255,255,.9) ; dots blancs (1er actif).
2. **Intérieure** — fond #FAF7F4 ; bandeau orange 14px ; logo bicolore ; titre + soulignement ; contenu (cartes, paragraphes, listes) ; dots orange.
3. **Citation** — grand guillemet orange, citation italique, attribution en orange gras.
4. **Message clé** — bloc orange plein, texte blanc gras.
5. **Liste "aussi voté"** — puces = carrés oranges 38×38 px rayon 10 px ; titre item 33px 700 #232326 ; texte 28px #6E6E73.
6. **Chronologie** — timeline verticale/horizontale orange.
7. **Clôture** — fond orange plein ; arcs décoratifs en BAS-DROITE (Ø ~560 et ~380, rgba(255,255,255,.5)) ; logo blanc ; titre centré blanc 48px 700 "Retrouvez le détail des délibérations sur" ; pastille blanche rayon 20px padding 22/56 avec "seyssins.fr" en orange 56px 700. PAS de dots.

## 5. COMMUNIQUÉ DE PRESSE (1 page A4, Helvetica)
Logo typographique haut-gauche · "COMMUNIQUÉ DE PRESSE" + date en orange à droite · ligne séparatrice orange · titre gras · intertitres orange · citations en italique avec noms en gras · footer contact presse avec filet orange : **Loïck Ferrucci, président du groupe, 06 51 81 66 73**.

## 6. RÈGLES D'ÉCRITURE (anti-IA)
- Pas de tirets cadratins dans les phrases.
- Pas de triades rhétoriques.
- Pas de "au service de" répété.
- Phrases courtes. Ton d'élu, sans familiarité.
- Texte FIDÈLE aux sources (CP, délibérations) — aucune réécriture inventée.

## 7. NOMMAGE DES FICHIERS
`Nom_Document_Vx_JJ_MOIS_AAAA` — ex. `CP_SNS_Jugement_TA_VDEF_11_JUIN_2026`.
Exports PNG : dossier `Vignettes_SNS_<sujet>/`, fichiers `0N_Slug.png` (1080×1080).

## 8. FICHIERS DE RÉFÉRENCE (dans ce dossier)
- `reference/Carrousel_Conseil_Municipal.dc.html` — source éditable des 9 vignettes de référence (le HTML/CSS inline fait foi pour tous les patterns).
- `reference/Carrousel_SNS_Canva.html` — version statique autonome : 1 page = 1 vignette (`data-document-role="page"`), styles inline, Google Fonts Poppins. **Point de départ idéal pour générer de nouveaux visuels.**
- `reference/vignettes_png/` — les 9 PNG 1080×1080 exportés (référence visuelle pixel-perfect).

## 9. RECETTE DE GÉNÉRATION (pour Claude Code)
1. Partir du gabarit HTML statique (`Carrousel_SNS_Canva.html`) : chaque vignette = `<div data-screen-label="0N" style="position:relative;width:1080px;height:1080px;overflow:hidden;...">`.
2. Styles 100% inline, police Poppins via Google Fonts, aucune autre dépendance.
3. Respecter les constantes du §4 à la lettre (marges 80px, bandeau 14px, soulignement 220×8, dots y≈1021…).
4. Adapter le nombre de dots au nombre réel de vignettes ; dot actif = index de la vignette.
5. Export PNG : rendu headless (Puppeteer/Playwright) à viewport 1080×1080, deviceScaleFactor 2, screenshot de chaque `[data-screen-label]`, puis redimensionner à 1080×1080.
