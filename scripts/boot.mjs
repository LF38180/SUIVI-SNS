// Script de démarrage robuste pour Railway.
// Objectif (cf. méthode "boot auto-réparant, jamais de crash en boucle") :
//   1. Diagnostiquer clairement l'état de DATABASE_URL.
//   2. Tenter la migration SI l'URL est présente ; ne JAMAIS bloquer le démarrage si elle échoue.
//   3. Démarrer l'app quoi qu'il arrive (le 502 disparaît, /api/health dira la vérité).
import { spawnSync, spawn } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'

const url = process.env.DATABASE_URL || ''
const masque = url ? url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@') : '(VIDE)'
console.log('[boot] DATABASE_URL =', masque)
console.log('[boot] PORT =', process.env.PORT || '(non défini, défaut 3000)')

// Garde-fou anti-perte de données (exigence n°1) : on refuse d'appliquer
// automatiquement une migration DESTRUCTIVE (DROP COLUMN/TABLE) sans autorisation
// explicite (ALLOW_DESTRUCTIVE_MIGRATION=1). C'est exactement ce type de migration
// qui, appliquée silencieusement, avait détruit les photos de la phase de test.
function migrationsDestructivesNonAppliquees() {
  try {
    const statut = spawnSync('npx', ['prisma', 'migrate', 'status'], { encoding: 'utf8', env: process.env })
    const sortie = (statut.stdout || '') + (statut.stderr || '')
    // Si tout est appliqué, rien à vérifier.
    if (/Database schema is up to date/i.test(sortie)) return []
    const dossiers = readdirSync('prisma/migrations', { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
    const destructives = []
    for (const nom of dossiers) {
      // On ne cite le fichier dans la sortie "status" que s'il n'est pas appliqué :
      // heuristique simple — on inspecte le SQL de chaque migration listée comme non appliquée.
      if (statut.status === 0 && !sortie.includes(nom)) continue
      try {
        const sql = readFileSync(`prisma/migrations/${nom}/migration.sql`, 'utf8')
        if (/DROP\s+(COLUMN|TABLE)/i.test(sql)) destructives.push(nom)
      } catch {
        /* ignore */
      }
    }
    return destructives
  } catch {
    return []
  }
}

if (url) {
  const destructives = migrationsDestructivesNonAppliquees()
  if (destructives.length > 0 && process.env.ALLOW_DESTRUCTIVE_MIGRATION !== '1') {
    console.warn('[boot] ⚠️  MIGRATION DESTRUCTIVE détectée et NON appliquée (garde-fou anti-perte) :')
    destructives.forEach((n) => console.warn('[boot]     - ' + n + ' contient un DROP COLUMN/TABLE'))
    console.warn('[boot]     Faire une sauvegarde, vérifier la migration, puis redéployer')
    console.warn('[boot]     avec ALLOW_DESTRUCTIVE_MIGRATION=1 pour l’appliquer volontairement.')
    console.warn('[boot]     L’app démarre sur le schéma ACTUEL (aucune donnée touchée).')
  } else {
    console.log('[boot] Application des migrations (prisma migrate deploy)…')
    const mig = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env })
    if (mig.status === 0) {
      console.log('[boot] Migrations OK.')
    } else {
      // On NE crashe PAS : la base est peut-être déjà à jour, ou l'URL invalide.
      // L'app démarre quand même ; /api/health permettra de diagnostiquer.
      console.warn('[boot] Migrations en échec (code ' + mig.status + '). Démarrage de l’app malgré tout.')
    }
  }
} else {
  console.warn('[boot] DATABASE_URL absente : migration sautée. L’app démarre, mais la base ne répondra pas.')
}

console.log('[boot] Démarrage de Next (next start -H 0.0.0.0)…')
const port = process.env.PORT || '3000'
const app = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], { stdio: 'inherit', env: process.env })
app.on('exit', (code) => process.exit(code ?? 0))
