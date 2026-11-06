import { inflateRawSync } from 'node:zlib'

// Conversion du fichier Excel « PPI COMMUNE » (DRF) vers le format JSON attendu par
// le simulateur de prospective : { version, years, dep:[{id, th, gest, lieu, des,
// prio, type, tiers, notif, nproj, y:{2026..2033}, coms}] }.
//
// On lit le .xlsx (= archive ZIP) sans dépendance externe : extraction via zlib natif,
// puis parsing XML léger adapté à ce format précis (feuille PPI COMMUNE = sheet3).
// Le simulateur HTML n'est pas modifié ; il reçoit du JSON comme avant.

const ANNEES = ['2026', '2027', '2028', '2029', '2030', '2031', '2032', '2033'] as const
// colonnes Excel : montant + commentaire par année (feuille PPI COMMUNE)
const COL_ANNEE: Record<string, [string, string]> = {
  '2026': ['AN', 'AW'], '2027': ['AX', 'AY'], '2028': ['AZ', 'BA'], '2029': ['BB', 'BC'],
  '2030': ['BD', 'BE'], '2031': ['BF', 'BG'], '2032': ['BH', 'BI'], '2033': ['BJ', 'BK'],
}

type LignePPI = {
  id: string; th: string; gest: string; lieu: string; des: string
  prio: string; type: string; tiers: string; notif: string; nproj: string
  y: Record<string, number>; coms: Record<string, string>
}
export type PpiConverti = {
  version: string; years: string[]; dep: LignePPI[]
  anomalies?: string[]
}

// ── mini-lecteur ZIP (xlsx) : renvoie une map nom→contenu texte des entrées voulues ──
function lireZip(buf: Buffer, veut: (nom: string) => boolean): Map<string, string> {
  const out = new Map<string, string>()
  // End Of Central Directory : on cherche la signature 0x06054b50 en fin de fichier
  let eocd = -1
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 22 - 65536; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('Archive xlsx invalide')
  const nbEntrees = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16) // début du Central Directory

  // Lecture bornée : toute lecture hors buffer d'un fichier malformé lève une
  // erreur maîtrisée (convertie en 422 par l'appelant), pas de lecture OOB.
  const u32 = (o: number) => { if (o < 0 || o + 4 > buf.length) throw new Error('xlsx corrompu'); return buf.readUInt32LE(o) }
  const u16 = (o: number) => { if (o < 0 || o + 2 > buf.length) throw new Error('xlsx corrompu'); return buf.readUInt16LE(o) }
  // garde-fou anti zip-bomb : une feuille PPI fait < 1 Mo décompressé. On refuse
  // bien avant d'inflater (taille déclarée) ET pendant (maxOutputLength zlib).
  const MAX_DECOMP = 20_000_000

  for (let n = 0; n < nbEntrees; n++) {
    if (p < 0 || p + 46 > buf.length || u32(p) !== 0x02014b50) break
    const methode = u16(p + 10)
    const tailleComp = u32(p + 20)
    const tailleDecomp = u32(p + 24)
    const tailleNom = u16(p + 28)
    const tailleExtra = u16(p + 30)
    const tailleComment = u16(p + 32)
    const offLocal = u32(p + 42)
    const nom = buf.toString('utf8', p + 46, Math.min(p + 46 + tailleNom, buf.length))
    p += 46 + tailleNom + tailleExtra + tailleComment

    if (!veut(nom)) continue
    if (tailleDecomp > MAX_DECOMP) throw new Error('Entrée xlsx trop volumineuse')
    // en-tête local pour connaître la taille réelle des champs nom/extra
    const nomLocal = u16(offLocal + 26)
    const extraLocal = u16(offLocal + 28)
    const debut = offLocal + 30 + nomLocal + extraLocal
    if (debut < 0 || debut + tailleComp > buf.length) throw new Error('xlsx corrompu')
    const comp = buf.subarray(debut, debut + tailleComp)
    const brut = methode === 0 ? comp : inflateRawSync(comp, { maxOutputLength: MAX_DECOMP })
    out.set(nom, brut.toString('utf8'))
  }
  return out
}

// ── parsing XML minimal d'une feuille ──
// &amp; est décodé EN DERNIER pour éviter un double décodage (&amp;amp;lt; → &lt;).
function decode(s: string): string {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, '&')
}

function lireSharedStrings(xml: string | undefined): string[] {
  if (!xml) return []
  const res: string[] = []
  for (const si of xml.match(/<si\b[\s\S]*?<\/si>/g) ?? []) {
    const parts = si.match(/<t[^>]*>([\s\S]*?)<\/t>/g) ?? []
    res.push(parts.map((t) => decode(t.replace(/<[^>]+>/g, ''))).join(''))
  }
  return res
}

// renvoie rows: Map<numéroLigne, Map<colonne, valeur string>>
// Parse cellule par cellule. Une regex globale sur la balise ouvrante <c ...> évite
// le piège d'une alternative gourmande qui avale plusieurs cellules self-closing.
function lireFeuille(xml: string, sst: string[]): Map<number, Map<string, string>> {
  const rows = new Map<number, Map<string, string>>()
  const reC = /<c\b([^>]*?)(\/>|>([\s\S]*?)<\/c>)/g
  let m: RegExpExecArray | null
  while ((m = reC.exec(xml)) !== null) {
    const attrs = m[1]
    const contenu = m[3] // undefined si self-closing
    const ref = attrs.match(/\br="([A-Z]+)(\d+)"/)
    if (!ref) continue
    const col = ref[1], ligne = Number(ref[2])
    const type = attrs.match(/\bt="([^"]+)"/)?.[1]
    let val: string | undefined
    if (contenu) {
      const inline = contenu.match(/<t[^>]*>([\s\S]*?)<\/t>/)
      const vm = contenu.match(/<v>([\s\S]*?)<\/v>/)
      if (type === 'inlineStr' && inline) val = decode(inline[1])
      // t="s" → index de shared string (déjà décodée) ; sinon (nombre ou t="str"
      // résultat texte de formule) on décode les entités de <v>.
      else if (vm) val = type === 's' ? (sst[Number(vm[1])] ?? '') : decode(vm[1])
      else if (inline) val = decode(inline[1])
    }
    if (val === undefined) continue
    if (!rows.has(ligne)) rows.set(ligne, new Map())
    rows.get(ligne)!.set(col, val)
  }
  return rows
}

// résout le fichier de la feuille « PPI COMMUNE » via workbook + rels
function fichierFeuillePPI(z: Map<string, string>): string {
  const wb = z.get('xl/workbook.xml') ?? ''
  const rels = z.get('xl/_rels/workbook.xml.rels') ?? ''
  const sheet = [...wb.matchAll(/<sheet\b[^>]*\/>/g)]
    .map((m) => m[0])
    .find((s) => /name="PPI COMMUNE"/i.test(s))
  if (!sheet) throw new Error('Feuille « PPI COMMUNE » introuvable dans le classeur')
  const rid = sheet.match(/r:id="([^"]+)"/)?.[1]
  const rel = [...rels.matchAll(/<Relationship\b[^>]*\/>/g)].map((m) => m[0]).find((r) => r.includes(`Id="${rid}"`))
  const tgt = rel?.match(/Target="([^"]+)"/)?.[1] ?? 'worksheets/sheet3.xml'
  // Target peut être absolu ("/xl/worksheets/..."), relatif ("worksheets/...")
  // ou déjà préfixé ("xl/worksheets/...").
  if (tgt.startsWith('/')) return tgt.slice(1)
  if (tgt.startsWith('xl/')) return tgt
  return 'xl/' + tgt
}

const norm = (x: string) => (x || '').replace(/\s+/g, ' ').trim().toUpperCase()
// Renvoie [montant, estAnormal]. estAnormal = cellule non vide mais non numérique
// (erreur Excel #REF!, montant stocké en texte « 1 234,50 »…) → à signaler, pas à
// avaler silencieusement comme 0.
function num(v: string | undefined): [number, boolean] {
  if (v === undefined || v.trim() === '') return [0, false]
  // tolère un format texte simple avec espaces et virgule décimale
  const nettoye = v.replace(/\s/g, '').replace(',', '.')
  const n = Number(nettoye)
  if (Number.isFinite(n)) return [Math.round(n), false]
  return [0, true]
}

// hash court déterministe (pour les lignes sans correspondance existante)
function hash8(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) }
  return (h >>> 0).toString(16).padStart(8, '0')
}

// ── point d'entrée : convertit le buffer xlsx en PPI JSON ──
// refPPI = PPI de référence déjà en base (pour réutiliser les id → diff correct), ou null.
export function convertirXlsx(buf: Buffer, version: string, refPPI: PpiConverti | null): PpiConverti {
  // 1re passe : métadonnées seulement (workbook, rels, sharedStrings). On évite de
  // décompresser les énormes feuilles inutiles (ex. Compta ~44 Mo).
  const meta = lireZip(buf, (n) =>
    n === 'xl/workbook.xml' || n === 'xl/_rels/workbook.xml.rels' || n === 'xl/sharedStrings.xml',
  )
  const sst = lireSharedStrings(meta.get('xl/sharedStrings.xml'))
  const fichier = fichierFeuillePPI(meta)
  // 2e passe : uniquement la feuille PPI COMMUNE.
  const z = lireZip(buf, (n) => n === fichier)
  const xml = z.get(fichier)
  if (!xml) throw new Error('Feuille PPI illisible')
  const rows = lireFeuille(xml, sst)

  // correspondances d'id depuis la référence existante (par n° projet, puis lieu+des)
  const parNproj = new Map<string, string>()
  const parLD = new Map<string, string>()
  for (const d of refPPI?.dep ?? []) {
    if (d.nproj) parNproj.set(String(d.nproj).trim(), d.id)
    parLD.set(norm(d.lieu) + '|' + norm(d.des), d.id)
  }

  const dep: LignePPI[] = []
  const vus = new Set<string>()
  const anomalies: string[] = []
  for (const [ligne, cells] of [...rows.entries()].sort((a, b) => a[0] - b[0])) {
    if (ligne < 6) continue // en-têtes jusqu'à la ligne 5
    const lieu = (cells.get('C') ?? '').trim()
    const des = (cells.get('D') ?? '').trim()
    if (!lieu && !des) continue
    if ((cells.get('K') ?? '').trim().toUpperCase() === 'REC') continue // recettes exclues

    const y: Record<string, number> = {}
    const coms: Record<string, string> = {}
    let total = 0
    for (const an of ANNEES) {
      const [mc, cc] = COL_ANNEE[an]
      const [m, anormal] = num(cells.get(mc))
      if (anormal) anomalies.push(`ligne ${ligne}, année ${an}`)
      y[an] = m; total += m
      const c = (cells.get(cc) ?? '').trim()
      if (c) coms[an] = c
    }
    if (total === 0) continue // aucune dépense prospective 2026-2033

    const nproj = (cells.get('E') ?? '').trim()
    let id = parNproj.get(nproj) || parLD.get(norm(lieu) + '|' + norm(des)) || hash8(nproj + '|' + lieu + '|' + des)
    let base = id, k = 1
    while (vus.has(id)) { id = base.slice(0, 6) + String(k++).padStart(2, '0') }
    vus.add(id)

    dep.push({
      id, th: (cells.get('A') ?? '').trim(), gest: (cells.get('B') ?? '').trim(),
      lieu, des, prio: (cells.get('G') ?? '').trim(), type: (cells.get('H') ?? '').trim(),
      tiers: (cells.get('I') ?? '').trim(), notif: (cells.get('J') ?? '').trim(),
      nproj, y, coms,
    })
  }
  if (dep.length === 0) throw new Error('Aucune ligne de dépense 2026-2033 trouvée (format inattendu ?)')
  return { version, years: [...ANNEES], dep, anomalies }
}
