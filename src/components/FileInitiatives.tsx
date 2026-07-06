'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type InitiativeVue = { id: number; intitule: string; description: string | null; auteur: string }

export function FileInitiatives({ initiatives }: { initiatives: InitiativeVue[] }) {
  const router = useRouter()
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')
  const [refusId, setRefusId] = useState<number | null>(null)
  const [motif, setMotif] = useState('')

  async function traiter(id: number, action: 'valider' | 'refuser', motifRefus?: string) {
    setEnCours(id)
    setErreur('')
    try {
      const res = await fetch(`/api/mesures/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, motifRefus }),
      })
      if (res.ok) {
        setRefusId(null)
        setMotif('')
        router.refresh()
      } else {
        setErreur('Action impossible (déjà traitée ?). Rechargez la page.')
      }
    } catch {
      setErreur('Pas de connexion — réessayez.')
    } finally {
      setEnCours(null)
    }
  }

  if (!initiatives.length) return null

  return (
    <div style={{ marginBottom: 30 }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>Initiatives hors programme à valider ({initiatives.length})</h2>
      {erreur && <div role="alert" style={{ color: '#C0461F', fontSize: 13, marginBottom: 8 }}>{erreur}</div>}
      {initiatives.map((it) => (
        <div key={it.id} className="card" style={{ borderLeft: '4px solid #2E6B33' }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{it.intitule}</div>
          {it.description && <div style={{ fontSize: 13, color: '#4a4a4f', marginBottom: 6 }}>{it.description}</div>}
          <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 10 }}>Proposée par <b>{it.auteur}</b></div>

          {refusId === it.id ? (
            <div>
              <input
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Motif du refus (facultatif, communiqué à l'élu)"
                style={{ width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit', marginBottom: 8 }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => traiter(it.id, 'refuser', motif)} disabled={enCours === it.id} style={{ minHeight: 44, padding: '8px 16px', background: '#C0461F', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                  Confirmer le refus
                </button>
                <button onClick={() => { setRefusId(null); setMotif('') }} className="btn" style={{ minHeight: 44 }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => traiter(it.id, 'valider')} disabled={enCours === it.id} style={{ minHeight: 44, padding: '8px 16px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Valider (publier)
              </button>
              <button onClick={() => setRefusId(it.id)} disabled={enCours === it.id} style={{ minHeight: 44, padding: '8px 16px', background: '#fff', color: '#C0461F', border: '1px solid #C0461F', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
                Refuser
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
