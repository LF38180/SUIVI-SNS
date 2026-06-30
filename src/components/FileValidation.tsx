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
  const [enCoursId, setEnCoursId] = useState<number | null>(null) // id en cours de traitement
  const [refusId, setRefusId] = useState<number | null>(null) // carte en mode "refus" (panneau ouvert)
  const [motif, setMotif] = useState('')
  const [groupeEnCours, setGroupeEnCours] = useState(false)
  const [recap, setRecap] = useState('')

  function toggle(id: number) {
    setSelection((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  async function traiterUn(id: number, action: 'valider' | 'refuser', motifRefus?: string | null) {
    try {
      const res = await fetch(`/api/propositions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, motifRefus }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  async function valider(id: number) {
    setEnCoursId(id)
    setRecap('')
    const ok = await traiterUn(id, 'valider')
    setEnCoursId(null)
    if (ok) router.refresh()
    else setRecap('Échec réseau. Réessayez.')
  }

  async function confirmerRefus(id: number) {
    setEnCoursId(id)
    setRecap('')
    const ok = await traiterUn(id, 'refuser', motif || null)
    setEnCoursId(null)
    if (ok) {
      setRefusId(null)
      setMotif('')
      router.refresh()
    } else {
      setRecap('Échec réseau. Réessayez.')
    }
  }

  async function validerSelection() {
    if (groupeEnCours || selection.size === 0) return
    setGroupeEnCours(true)
    setRecap('')
    let ok = 0
    let echec = 0
    for (const id of selection) {
      const r = await traiterUn(id, 'valider')
      if (r) ok++
      else echec++
    }
    setGroupeEnCours(false)
    setSelection(new Set())
    setRecap(echec === 0 ? `${ok} proposition(s) validée(s).` : `${ok} validée(s), ${echec} en échec (réessayez).`)
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
        <button onClick={validerSelection} disabled={groupeEnCours || selection.size === 0} className="btn primary" style={{ opacity: selection.size === 0 ? 0.5 : 1, minHeight: 44 }}>
          {groupeEnCours ? 'Validation…' : `Valider la sélection (${selection.size})`}
        </button>
      </div>

      {recap && (
        <div role="status" style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#FCE9E1', color: '#C0461F', fontSize: 13 }}>
          {recap}
        </div>
      )}

      {propositions.map((p) => {
        const enRetard = p.depuisJours >= 7
        const traitement = enCoursId === p.id
        const enRefus = refusId === p.id
        return (
          <div key={p.id} className="card" style={{ borderLeft: '4px solid #EE6B3E', opacity: traitement ? 0.6 : 1 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <input
                type="checkbox"
                checked={selection.has(p.id)}
                onChange={() => toggle(p.id)}
                style={{ width: 22, height: 22, marginTop: 2, cursor: 'pointer', flex: 'none' }}
                aria-label={`Sélectionner ${p.mesureIntitule}`}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.mesureIntitule}</div>
                <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 6 }}>
                  Proposé par <b>{p.auteur}</b> :{' '}
                  <span style={{ textDecoration: 'line-through', color: '#6E6E73' }}>{p.ancien}%</span>{' '}
                  → <b style={{ color: '#C0461F' }}>{p.propose}%</b>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '1px 8px',
                      borderRadius: 10,
                      background: enRetard ? '#FCE9E1' : '#FAF7F4',
                      color: enRetard ? '#C0461F' : '#6E6E73',
                      fontWeight: 600,
                    }}
                  >
                    en attente depuis {p.depuisJours} j
                  </span>
                </div>
                {p.commentaire && <div style={{ fontSize: 13, marginBottom: 8 }}>« {p.commentaire} »</div>}

                {!enRefus ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => valider(p.id)} disabled={traitement} style={{ minHeight: 44, padding: '8px 16px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                      {traitement ? 'Validation…' : 'Valider'}
                    </button>
                    <button onClick={() => { setRefusId(p.id); setMotif('') }} disabled={traitement} style={{ minHeight: 44, padding: '8px 16px', background: '#fff', color: '#C0461F', border: '1px solid #C0461F', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                      Refuser
                    </button>
                  </div>
                ) : (
                  /* Panneau de refus inline (remplace prompt) */
                  <div style={{ marginTop: 6 }}>
                    <textarea
                      placeholder="Motif du refus (visible par l'élu) — facultatif"
                      value={motif}
                      onChange={(e) => setMotif(e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit', fontSize: 16 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => confirmerRefus(p.id)} disabled={traitement} style={{ minHeight: 44, padding: '8px 16px', background: '#C0461F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                        {traitement ? 'Envoi…' : 'Confirmer le refus'}
                      </button>
                      <button onClick={() => { setRefusId(null); setMotif('') }} className="btn" style={{ minHeight: 44 }}>
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
