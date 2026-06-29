'use client'
import { useState, useMemo } from 'react'
import { Barre } from './Barre'
import { BadgeStatut } from './BadgeStatut'
import { statutDe } from '@/lib/statut'
import { NOMS_AXES } from '@/lib/axes'

export type MesurePublique = {
  id: number
  categorie: string
  intitule: string
  avancementPublie: number
  majDepuis: string | null
}

const AXES = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4']

export function PublicMesures({ mesures, partageActif }: { mesures: MesurePublique[]; partageActif: boolean }) {
  const [axe, setAxe] = useState('')
  const [stat, setStat] = useState('')
  const [q, setQ] = useState('')

  const filtrees = useMemo(
    () =>
      mesures.filter((m) => {
        if (axe && m.categorie !== axe) return false
        if (stat && statutDe(m.avancementPublie).nom !== stat) return false
        if (q && !m.intitule.toLowerCase().includes(q.toLowerCase())) return false
        return true
      }),
    [mesures, axe, stat, q],
  )

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
        <input
          type="search"
          placeholder="Rechercher un engagement…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        />
        <select value={stat} onChange={(e) => setStat(e.target.value)} style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}>
          <option value="">Tout voir</option>
          <option>Réalisé</option>
          <option>En cours</option>
          <option>Engagé</option>
          <option>Non démarré</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
        {['', ...AXES].map((a) => (
          <button key={a || 'tous'} onClick={() => setAxe(a)} className={'chip' + (axe === a ? ' on' : '')}>
            {a ? NOMS_AXES[a] : 'Tous les thèmes'}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {filtrees.length === 0 && <div style={{ textAlign: 'center', color: '#6E6E73', padding: 40 }}>Aucun engagement ne correspond.</div>}
        {AXES.filter((a) => !axe || a === axe).map((a) => {
          const ms = filtrees.filter((m) => m.categorie === a)
          if (!ms.length) return null
          return (
            <div key={a}>
              <div style={{ margin: '26px 0 10px', fontSize: 16, fontWeight: 700 }}>{NOMS_AXES[a]}</div>
              {ms.map((m) => (
                <div key={m.id} className="card">
                  <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 7 }}>{m.intitule}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <BadgeStatut avancement={m.avancementPublie} />
                    <b style={{ color: '#C0461F' }}>{m.avancementPublie}%</b>
                  </div>
                  <Barre pourcent={m.avancementPublie} />
                  {m.majDepuis && <div style={{ fontSize: 11, color: '#9A9AA0', marginTop: 6 }}>Mis à jour {m.majDepuis}</div>}
                  {partageActif && (
                    <button
                      onClick={() => {
                        const url = `${window.location.origin}/public#mesure-${m.id}`
                        if (navigator.share) navigator.share({ title: m.intitule, url })
                        else navigator.clipboard?.writeText(url)
                      }}
                      className="btn"
                      style={{ marginTop: 8, fontSize: 12 }}
                    >
                      Partager
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
