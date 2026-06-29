import { toutesLesMesures } from '@/lib/requetes'
import { EnTete } from '@/components/EnTete'
import { ListeMesures, MesureVue } from '@/components/ListeMesures'

export default async function PageMesures() {
  const mesures = await toutesLesMesures()
  const vues: MesureVue[] = mesures.map((m) => ({
    id: m.id,
    categorie: m.categorie,
    rubrique: m.rubrique,
    intitule: m.intitule,
    avancementPublie: m.avancementPublie,
    referent: m.eluReferent?.nom ?? null,
    natureCout: m.natureCout,
    ordreGrandeur: m.ordreGrandeur,
    echeanceCible: m.echeanceCible ? m.echeanceCible.toISOString().slice(0, 10) : null,
  }))
  const referents = [...new Set(vues.map((v) => v.referent).filter(Boolean) as string[])].sort()
  return (
    <>
      <EnTete titre="Les engagements" sousTitre="Détail par axe, filtrable." />
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 22px 80px' }}>
        <ListeMesures mesures={vues} referents={referents} />
      </div>
    </>
  )
}
