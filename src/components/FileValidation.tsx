'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export type PropVue = {
  id: number
  mesureIntitule: string
  auteur: string
  ancien: number
  propose: number
  commentaire: string | null
  depuisJours: number
}

export function FileValidation({ propositions }: { propositions: PropVue[] }) {
  const router = useRouter()
  const [selection, setSelection] = useState<Set<number>>(new Set())
  const [enCours, setEnCours] = useState(false)

  function toggle(id: number) {
    setSelection((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  async function traiterUn(id: number, action: 'valider' | 'refuser', motifRefus?: string | null) {
    const res = await fetch(`/api/propositions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, motifRefus }),
    })
    return res.ok
  }

  async function traiter(id: number, action: 'valider' | 'refuser') {
    if (enCours) return
    let motif: string | null = null
    if (action === 'refuser') motif = prompt('Motif du refus (visible par l’élu) :') || null
    setEnCours(true)
    const ok = await traiterUn(id, action, motif)
    setEnCours(false)
    if (ok) router.refresh()
    else alert('Erreur lors du traitement.')
  }

  async function validerSelection() {
    if (enCours || selection.size === 0) return
    if (!confirm(`Valider ${selection.size} proposition(s) ?`)) return
    setEnCours(true)
    for (const id of selection) {
      await traiterUn(id, 'valider')
    }
    setEnCours(false)
    setSelection(new Set())
    router.refresh()
  }

  if (!propositions.length) {
    return <div style={{ color: '#6E6E73', padding: 40, textAlign: 'center' }}>Aucune proposition en attente. 🎉</div>
  }

  return (
    <div>
      {/* Barre d'actions groupées */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
        <button
          onClick={() => setSelection(selection.size === propositions.length ? new Set() : new Set(propositions.map((p) => p.id)))}
          className="btn"
        >
          {selection.size === propositions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
        </button>
        <button onClick={validerSelection} disabled={enCours || selection.size === 0} className="btn primary" style={{ opacity: selection.size === 0 ? 0.5 : 1 }}>
          Valider la sélection ({selection.size})
        </button>
      </div>

      {propositions.map((p) => {
        const enRetard = p.depuisJours >= 7
        return (
          <div key={p.id} className="card" style={{ borderLeft: '4px solid #EE6B3E' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={selection.has(p.id)}
                onChange={() => toggle(p.id)}
                style={{ width: 20, height: 20, marginTop: 2, cursor: 'pointer', flex: 'none' }}
                aria-label={`Sélectionner ${p.mesureIntitule}`}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.mesureIntitule}</div>
                <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 6 }}>
                  Proposé par <b>{p.auteur}</b> :{' '}
                  <span style={{ textDecoration: 'line-through', color: '#9A9AA0' }}>{p.ancien}%</span>{' '}
                  → <b style={{ color: '#C0461F' }}>{p.propose}%</b>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '1px 8px',
                      borderRadius: 10,
                      background: enRetard ? '#FCE9E1' : '#FAF7F4',
                      color: enRetard ? '#C0461F' : '#9A9AA0',
                      fontWeight: 600,
                    }}
                  >
                    en attente depuis {p.depuisJours} j
                  </span>
                </div>
                {p.commentaire && <div style={{ fontSize: 13, marginBottom: 8 }}>« {p.commentaire} »</div>}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => traiter(p.id, 'valider')} disabled={enCours} style={{ padding: '8px 14px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    Valider
                  </button>
                  <button onClick={() => traiter(p.id, 'refuser')} disabled={enCours} style={{ padding: '8px 14px', background: '#fff', color: '#C0461F', border: '1px solid #C0461F', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                    Refuser
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
