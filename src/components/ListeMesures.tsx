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
  natureCout: string | null
  ordreGrandeur: string | null
  echeanceCible: string | null // ISO yyyy-mm-dd ou null
}

export function ListeMesures({ mesures, referents }: { mesures: MesureVue[]; referents: string[] }) {
  const [axe, setAxe] = useState('')
  const [ref, setRef] = useState('')
  const [stat, setStat] = useState('')
  const [ech, setEch] = useState('') // '', 'retard', 'avenir'
  const [q, setQ] = useState('')

  const aujourdhui = new Date().toISOString().slice(0, 10)

  const filtrees = useMemo(
    () =>
      mesures.filter((m) => {
        if (axe && m.categorie !== axe) return false
        if (ref && m.referent !== ref) return false
        if (stat && statutDe(m.avancementPublie).nom !== stat) return false
        if (ech === 'retard') {
          // en retard : échéance passée ET mesure non réalisée
          if (!m.echeanceCible || m.echeanceCible >= aujourdhui || m.avancementPublie >= 100) return false
        }
        if (ech === 'avenir') {
          // à venir : échéance future, non réalisée
          if (!m.echeanceCible || m.echeanceCible < aujourdhui || m.avancementPublie >= 100) return false
        }
        if (q) {
          const h = `${m.intitule} ${m.referent ?? ''} ${m.rubrique}`.toLowerCase()
          if (!h.includes(q.toLowerCase())) return false
        }
        return true
      }),
    [mesures, axe, ref, stat, ech, q, aujourdhui],
  )

  const axes = ['AXE_1', 'AXE_2', 'AXE_3', 'AXE_4']

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
        <select
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        >
          <option value="">Tous les référents</option>
          {referents.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={stat}
          onChange={(e) => setStat(e.target.value)}
          style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        >
          <option value="">Tous les statuts</option>
          <option>Non démarré</option>
          <option>Engagé</option>
          <option>En cours</option>
          <option>Réalisé</option>
        </select>
        <select
          value={ech}
          onChange={(e) => setEch(e.target.value)}
          style={{ padding: '11px 12px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        >
          <option value="">Toutes échéances</option>
          <option value="retard">En retard</option>
          <option value="avenir">À venir</option>
        </select>
      </div>
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 14 }}>
        {['', ...axes].map((a) => (
          <button key={a || 'tous'} onClick={() => setAxe(a)} className={'chip' + (axe === a ? ' on' : '')}>
            {a ? a.replace('_', ' ') : 'Tous les axes'}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 20 }}>
        {filtrees.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6E6E73', padding: 50 }}>Aucune mesure ne correspond.</div>
        )}
        {axes.map((a) => {
          const ms = filtrees.filter((m) => m.categorie === a)
          if (!ms.length) return null
          return (
            <div key={a}>
              <div style={{ margin: '30px 0 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: '#EE6B3E', padding: '4px 10px', borderRadius: 6 }}>
                  {a.replace('_', ' ')}
                </span>
                <span style={{ fontSize: 17, fontWeight: 700 }}>{NOMS_AXES[a]}</span>
              </div>
              {ms.map((m) => (
                <Link key={m.id} href={`/mesures/${m.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="card">
                    <div style={{ fontSize: 11, color: '#EE6B3E', fontWeight: 600 }}>{m.rubrique}</div>
                    <div style={{ fontSize: 14.5, fontWeight: 600, margin: '2px 0 7px' }}>{m.intitule}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 8 }}>
                      <BadgeStatut avancement={m.avancementPublie} />
                      {m.referent && (
                        <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#fff', border: '1px solid #ECE5DF' }}>
                          {m.referent}
                        </span>
                      )}
                      <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 6, background: '#FAF7F4', border: '1px solid #ECE5DF', color: '#6E6E73' }}>
                        Coût : {m.ordreGrandeur}
                      </span>
                    </div>
                    <Barre pourcent={m.avancementPublie} />
                  </div>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
