// Script de démarrage robuste pour Railway.
// Objectif (cf. méthode "boot auto-réparant, jamais de crash en boucle") :
//   1. Diagnostiquer clairement l'état de DATABASE_URL.
//   2. Tenter la migration SI l'URL est présente ; ne JAMAIS bloquer le démarrage si elle échoue.
//   3. Démarrer l'app quoi qu'il arrive (le 502 disparaît, /api/health dira la vérité).
import { spawnSync, spawn } from 'node:child_process'

const url = process.env.DATABASE_URL || ''
const masque = url ? url.replace(/:\/\/([^:]+):[^@]+@/, '://$1:***@') : '(VIDE)'
console.log('[boot] DATABASE_URL =', masque)
console.log('[boot] PORT =', process.env.PORT || '(non défini, défaut 3000)')

if (url) {
  console.log('[boot] Application des migrations (prisma migrate deploy)…')
  const mig = spawnSync('npx', ['prisma', 'migrate', 'deploy'], { stdio: 'inherit', env: process.env })
  if (mig.status === 0) {
    console.log('[boot] Migrations OK.')
  } else {
    // On NE crashe PAS : la base est peut-être déjà à jour, ou l'URL invalide.
    // L'app démarre quand même ; /api/health permettra de diagnostiquer.
    console.warn('[boot] Migrations en échec (code ' + mig.status + '). Démarrage de l’app malgré tout.')
  }
} else {
  console.warn('[boot] DATABASE_URL absente : migration sautée. L’app démarre, mais la base ne répondra pas.')
}

console.log('[boot] Démarrage de Next (next start -H 0.0.0.0)…')
const port = process.env.PORT || '3000'
const app = spawn('npx', ['next', 'start', '-H', '0.0.0.0', '-p', port], { stdio: 'inherit', env: process.env })
app.on('exit', (code) => process.exit(code ?? 0))
