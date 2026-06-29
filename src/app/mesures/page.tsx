import { toutesLesMesures, depuis } from '@/lib/requetes'
import { EnTete } from '@/components/EnTete'
import { ListeMesures, MesureVue } from '@/components/ListeMesures'

export default async function PageMesures({ searchParams }: { searchParams: Promise<{ axe?: string }> }) {
  const { axe } = await searchParams
  const mesures = await toutesLesMesures()
  const vues: MesureVue[] = mesures.map((m) => ({
    id: m.id,
    categorie: m.categorie,
    rubrique: m.rubrique,
    intitule: m.intitule,
    avancementPublie: m.avancementPublie,
    referent: m.eluReferent?.nom ?? null,
    elus: [
      m.eluReferent?.nom,
      m.adjointRattachement?.nom,
      ...m.coReferents.map((c) => c.user.nom),
    ].filter(Boolean) as string[],
    natureCout: m.natureCout,
    ordreGrandeur: m.ordreGrandeur,
    echeanceCible: m.echeanceCible ? m.echeanceCible.toISOString().slice(0, 10) : null,
    majDepuis: depuis(m.historique[0]?.date ?? null),
  }))
  const referents = [...new Set(vues.map((v) => v.referent).filter(Boolean) as string[])].sort()
  const axeInitial = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4', 'HORS_PROGRAMME'].includes(axe ?? '') ? axe! : ''
  return (
    <>
      <EnTete titre="Les engagements" sousTitre="Détail par axe, filtrable." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <ListeMesures mesures={vues} referents={referents} axeInitial={axeInitial} />
      </div>
    </>
  )
}
