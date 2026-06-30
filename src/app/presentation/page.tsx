import { lireSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { toutesLesMesures, moyenne, agregatsParAxe } from '@/lib/requetes'
import { NOMS_AXES } from '@/lib/axes'
import { Presentation, AxeSlide } from '@/components/Presentation'

export default async function PagePresentation() {
  const session = await lireSession()
  if (!session) redirect('/connexion')
  const mesures = await toutesLesMesures()
  const programme = mesures.filter((m) => m.categorie !== 'HORS_PROGRAMME')
  const global = moyenne(programme.map((m) => m.avancementPublie))
  const axes: AxeSlide[] = agregatsParAxe(programme).map((a) => ({
    axe: a.axe,
    nom: NOMS_AXES[a.axe],
    pourcent: a.pourcent,
    nb: a.nb,
    realisees: a.realisees,
  }))
  return <Presentation global={global} total={programme.length} axes={axes} />
}
