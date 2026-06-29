'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Barre } from './Barre'
import { BadgeStatut } from './BadgeStatut'
import { statutDe } from '@/lib/statut'
import { NOMS_AXES } from '@/lib/axes'

export type MesureVue = {
  id: number
  categorie: string
  rubrique: string
  intitule: string
  avancementPublie: number
  referent: string | null
  elus: string[]
  natureCout: string | null
  ordreGrandeur: string | null
  echeanceCible: string | null // ISO yyyy-mm-dd ou null
}

const ORDRE_AXES = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4', 'HORS_PROGRAMME']

export function ListeMesures({
  mesures,
  referents,
  axeInitial = '',
}: {
  mesures: MesureVue[]
  referents: string[]
  axeInitial?: string
}) {
  const [axe, setAxe] = useState(axeInitial)
  const [ref, setRef] = useState('')
  const [stat, setStat] = useState('')
  const [ech, setEch] = useState('')
  const [q, setQ] = useState('')

  const aujourdhui = new Date().toISOString().slice(0, 10)

  const filtrees = useMemo(
    () =>
      mesures.filter((m) => {
        if (axe && m.categorie !== axe) return false
        if (ref && !m.elus.includes(ref)) return false
        if (stat && statutDe(m.avancementPublie).nom !== stat) return false
        if (ech === 'retard') {
          if (!m.echeanceCible || m.echeanceCible >= aujourdhui || m.avancementPublie >= 100) return false
        }
        if (ech === 'avenir') {
          if (!m.echeanceCible || m.echeanceCible < aujourdhui || m.avancementPublie >= 100) return false
        }
        if (q) {
          const h = `${m.intitule} ${m.elus.join(' ')} ${m.rubrique}`.toLowerCase()
          if (!h.includes(q.toLowerCase())) return false
        }
        return true
      }),
    [mesures, axe, ref, stat, ech, q, aujourdhui],
  )

  // numérotation continue dans l'ordre d'affichage
  const axesPresents = ORDRE_AXES.filter((a) => filtrees.some((m) => m.categorie === a))

  let numero = 0

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
        <input
          type="search"
          placeholder="Rechercher une mesure, un élu…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        />
        <select value={ref} onChange={(e) => setRef(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}>
          <option value="">Tous les référents</option>
          {referents.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select value={stat} onChange={(e) => setStat(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}>
          <option value="">Tous les statuts</option>
          <option>Non démarré</option>
          <option>Engagé</option>
          <option>En cours</option>
          <option>Réalisé</option>
        </select>
        <select value={ech} onChange={(e) => setEch(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}>
          <option value="">Toutes échéances</option>
          <option value="retard">En retard</option>
          <option value="avenir">À venir</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
        {['', ...ORDRE_AXES].map((a) => (
          <button key={a || 'tous'} onClick={() => setAxe(a)} className={'chip' + (axe === a ? ' on' : '')}>
            {a ? (a === 'HORS_PROGRAMME' ? 'Hors programme' : a.replace('_', ' ')) : 'Tous les axes'}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {filtrees.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6E6E73', padding: 50 }}>Aucune mesure ne correspond.</div>
        )}
        {axesPresents.map((a) => {
          const ms = filtrees.filter((m) => m.categorie === a)
          if (!ms.length) return null
          const rubriques = [...new Set(ms.map((m) => m.rubrique))]
          return (
            <div key={a}>
              <div style={{ margin: '30px 0 6px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>
                  {a === 'HORS_PROGRAMME' ? 'INITIATIVES' : a.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[a]}</span>
              </div>
              {rubriques.map((rub) => (
                <div key={rub}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#EE6B3E', margin: '14px 0 6px' }}>{rub}</div>
                  {ms
                    .filter((m) => m.rubrique === rub)
                    .map((m) => {
                      numero += 1
                      return (
                        <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div className="card">
                            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                              <span style={{ color: '#9A9AA0', fontWeight: 700, fontSize: 12 }}>{numero}</span>
                              <div style={{ fontSize: 14.5, fontWeight: 600, flex: 1 }}>{m.intitule}</div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', margin: '8px 0' }}>
                              <BadgeStatut avancement={m.avancementPublie} />
                              {m.elus.length > 0 && (
                                <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#fff', border: '1px solid #ECE5DF' }}>
                                  {m.elus.join(', ')}
                                </span>
                              )}
                              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#FAF7F4', border: '1px solid #ECE5DF', color: '#6E6E73' }}>
                                Coût : {m.ordreGrandeur}
                              </span>
                            </div>
                            <Barre pourcent={m.avancementPublie} />
                          </div>
                        </Link>
                      )
                    })}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
