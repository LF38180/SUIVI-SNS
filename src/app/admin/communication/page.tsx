import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { EnTete } from '@/components/EnTete'
import { GalerieCom } from '@/components/GalerieCom'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PageCommunication() {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')

  // Top mesures qui font une bonne com : les plus avancées (hors 0%), max 6.
  const top = await prisma.mesure.findMany({
    where: { deletedAt: null, statutMesure: 'VALIDEE', avancementPublie: { gt: 0 } },
    orderBy: [{ avancementPublie: 'desc' }, { ordre: 'asc' }],
    take: 6,
    select: { id: true, intitule: true, avancementPublie: true },
  })

  const vignettes = [
    { cle: 'bilan', titre: 'Bilan global', sousTitre: 'Vue d’ensemble du programme', url: '/api/bilan/image', fichier: 'sns-bilan-global.png' },
    ...top.map((m) => ({
      cle: `m-${m.id}`,
      titre: m.intitule,
      sousTitre: `${m.avancementPublie}% · à partager`,
      url: `/api/mesures/${m.id}/image-partage`,
      fichier: `sns-mesure-${m.id}.png`,
    })),
  ]

  return (
    <>
      <EnTete titre="Communication" sousTitre="Vignettes prêtes à partager, à votre charte." />
      <div style={{ maxWidth: 1180, margin: '20px auto 0', padding: '0 22px 80px' }}>
        <div style={{ marginBottom: 16 }}>
          <Link href="/admin" style={{ color: '#C0461F', fontWeight: 600, fontSize: 14 }}>← Retour à l’espace admin</Link>
        </div>

        <div className="note" style={{ background: '#FCE9E1', borderRadius: 10, padding: '12px 15px', fontSize: 13, color: '#C0461F', marginBottom: 20 }}>
          <b>Comment ça marche ?</b> Ces images sont générées automatiquement aux couleurs SNS et se mettent à jour toutes seules.
          Téléchargez-les une par une, ou tout le carrousel d’un coup, puis publiez sur vos réseaux.
        </div>

        <GalerieCom vignettes={vignettes} />
      </div>
    </>
  )
}
