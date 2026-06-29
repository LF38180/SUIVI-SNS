import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
import { hashMotDePasse } from '../src/lib/auth'
import { ELUS } from '../src/data/elus'
import { MESURES } from '../src/data/mesures'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  // PROTECTION : ne jamais réécraser des données existantes (idempotent).
  // Garantit qu'un redéploiement ne supprime ni n'écrase rien (exigence commanditaire).
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
      data: { nom: e.nom, email: e.email.toLowerCase(), motDePasseHash: hash, role: e.role, fonction: e.fonction },
    })
    keyToId.set(e.key, u.id)
  }
  // binôme adjoint de rattachement (clé élu → clé adjoint)
  const eluAdjoint = new Map<string, string | undefined>()
  for (const e of ELUS) eluAdjoint.set(e.key, e.adjointKey)

  // 2) mesures
  let ordre = 0
  for (const m of MESURES) {
    const refId = m.referentKey ? (keyToId.get(m.referentKey) ?? null) : null
    const adjKey = m.referentKey ? eluAdjoint.get(m.referentKey) : undefined
    const adjId = adjKey ? (keyToId.get(adjKey) ?? null) : null
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
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
