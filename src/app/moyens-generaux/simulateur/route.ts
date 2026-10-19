import { NextResponse } from 'next/server'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { prisma } from '@/lib/db'
import { lireSession } from '@/lib/session'
import { peutAccederMoyensGeneraux } from '@/lib/permissions'

export const runtime = 'nodejs'

// Sert le simulateur (fichier HTML autonome) en y injectant le contexte de session.
// Le fichier est une DONNÉE versionnée dans le dépôt, pas du code de l'app : on le
// lit avec fs et on injecte 4 variables + un bandeau de retour avant </head>.
let cacheHtml: string | null = null

// Regex des sauts de ligne / séparateurs Unicode, construite par code point pour
// ne pas écrire de caractère invisible dans le source.
const SAUTS = new RegExp('[' + [0x0a, 0x0d, 0x2028, 0x2029].map((c) => '\\u' + c.toString(16).padStart(4, '0')).join('') + ']', 'g')

function echapper(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/</g, '\\u003c')
    // sinon un nom multi-ligne casse la chaîne JS et permet d'injecter des instructions
    .replace(SAUTS, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'))
}

export async function GET() {
  const session = await lireSession()
  // On ne révèle pas l'existence du module : accès refusé → page introuvable.
  if (!session || !(await peutAccederMoyensGeneraux(session))) {
    return new NextResponse('Introuvable', { status: 404 })
  }

  const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { nom: true } })
  const nom = u?.nom ?? ''

  if (!cacheHtml) {
    cacheHtml = await readFile(
      join(process.cwd(), 'src/modules/moyens-generaux/simulateur/Simulateur_Prospective.html'),
      'utf8',
    )
  }

  const inject = `<script>
window.SIM_API="/api/moyens-generaux/simulateur";
window.SIM_USER="${echapper(nom)}";
window.SIM_USER_ID="${session.userId}";
window.SIM_ROLE="${session.role}";
</script>
<style>
#sns-retour{position:fixed;top:8px;left:8px;z-index:99999;background:#EE6B3E;color:#fff;
  text-decoration:none;font:600 13px/1 system-ui,sans-serif;padding:8px 14px;border-radius:999px;
  box-shadow:0 4px 14px rgba(35,35,38,.2)}
</style>`
  const banniere = `<a id="sns-retour" href="/moyens-generaux">← Retour au suivi</a>`

  // Fonctions de remplacement (pas de chaîne) : sinon $&, $', $` présents dans un
  // nom injecté seraient interprétés par String.replace.
  const html = cacheHtml
    .replace('</head>', () => inject + '</head>')
    .replace(/<body([^>]*)>/, (m) => m + banniere)

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
