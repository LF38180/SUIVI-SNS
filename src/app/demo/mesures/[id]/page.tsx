import { lireSession } from '@/lib/session'
import { peutValider } from '@/lib/permissions'
import { redirect, notFound } from 'next/navigation'
import { EnTete } from '@/components/EnTete'
import { Barre } from '@/components/Barre'
import { BadgeStatut } from '@/components/BadgeStatut'
import { Section } from '@/components/Section'
import { BlocMiseAJourDemo } from '@/components/BlocMiseAJourDemo'
import { BandeauDemo } from '@/components/BandeauDemo'
import { chargerDemo } from '@/lib/demo'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const LIBELLE_SITUATION: Record<string, string> = {
  REPORTEE: 'Mesure reportée',
  ADAPTEE: 'Mesure adaptée',
  ABANDONNEE: 'Mesure abandonnée',
}

export default async function FicheMesureDemo({ params }: { params: Promise<{ id: string }> }) {
  const session = await lireSession()
  if (!session || !peutValider(session.role)) redirect('/')
  const { id } = await params

  const demo = await chargerDemo()
  const ligne = demo.find((x) => x.m.id === Number(id))
  if (!ligne) notFound()
  const { m, resp, conc, d } = ligne

  const label = { fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '.4px', color: '#6E6E73', fontWeight: 600, marginBottom: 2 }

  return (
    <>
      <BandeauDemo />
      <EnTete titre={m.intitule} sousTitre={m.rubrique} />
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '0 22px 80px' }}>
        <div style={{ marginTop: 12 }}>
          <Link href="/demo" style={{ color: '#C0461F', fontWeight: 600, fontSize: 14 }}>← Retour à la démo</Link>
        </div>

        {/* Synthèse */}
        <div className="panel" style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
            <BadgeStatut avancement={d.avancement} />
            <b style={{ fontSize: 18, color: '#C0461F' }}>{d.avancement}%</b>
          </div>
          <Barre pourcent={d.avancement} />
          {d.situation !== 'NORMALE' && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: '#FCE9E1', fontSize: 13, color: '#C0461F' }}>
              <b>{LIBELLE_SITUATION[d.situation]}</b>
            </div>
          )}
          <div style={{ marginTop: 12, fontSize: 13 }}>
            <span style={{ color: '#6E6E73' }}>{resp.length > 1 ? 'Responsables : ' : 'Responsable : '}</span>
            {resp.length ? <b>{resp.map((u) => u.nom).join(', ')}</b> : <span style={{ color: '#6E6E73' }}>à définir</span>}
            {conc.length > 0 && <span style={{ color: '#6E6E73' }}> · avec {conc.map((u) => u.nom).join(', ')}</span>}
          </div>
        </div>

        {/* Bloc mise à jour (simulé) */}
        <BlocMiseAJourDemo avancementActuel={d.avancement} />

        {/* Journal de bord — le cœur du reporting */}
        <div className="panel" style={{ marginTop: 18 }}>
          <h2>Journal de bord</h2>
          {d.journal.length === 0 && <div style={{ color: '#6E6E73', fontSize: 13 }}>Aucune action pour l’instant.</div>}
          {[...d.journal].reverse().map((j, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: '1px solid #ECE5DF', fontSize: 13 }}>
              <span style={{ color: '#9A9AA0', minWidth: 92, fontSize: 12 }}>{j.date.toLocaleDateString('fr-FR')}</span>
              <span style={{ flex: 1 }}>
                {j.texte}
                <span style={{ color: '#6E6E73' }}> — {j.auteur}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Détails */}
        <Section titre="Détails (coût, besoins)">
          <div style={{ display: 'flex', gap: 30, flexWrap: 'wrap' }}>
            <div>
              <div style={label}>Coût</div>
              <div style={{ fontSize: 14 }}>{m.natureCout ?? '—'}{m.ordreGrandeur ? ` · ${m.ordreGrandeur}` : ''}</div>
            </div>
          </div>
          {m.besoins && (
            <div style={{ marginTop: 14 }}>
              <div style={label}>Besoins</div>
              <div style={{ fontSize: 13 }}>{m.besoins}</div>
            </div>
          )}
        </Section>
      </div>
    </>
  )
}
