'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export type PhotoVue = { id: number; mesureIntitule: string; auteur: string; type: string }

export function FilePhotos({ photos }: { photos: PhotoVue[] }) {
  const router = useRouter()
  const [enCours, setEnCours] = useState<number | null>(null)
  const [erreur, setErreur] = useState('')

  async function traiter(id: number, action: 'valider' | 'refuser') {
    setEnCours(id)
    setErreur('')
    try {
      const res = await fetch(`/api/pieces-jointes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) router.refresh()
      else setErreur('Action impossible (photo déjà traitée ?). Rechargez la page.')
    } catch {
      setErreur('Pas de connexion — réessayez.')
    } finally {
      // finally garantit le dégel des boutons même si le réseau coupe.
      setEnCours(null)
    }
  }

  if (!photos.length) return null

  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 15, marginBottom: 12 }}>Photos &amp; documents à valider ({photos.length})</h2>
      {erreur && <div role="alert" style={{ color: '#C0461F', fontSize: 13, marginBottom: 8 }}>{erreur}</div>}
      {photos.map((p) => (
        <div key={p.id} className="card" style={{ borderLeft: '4px solid #C98A1A' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.mesureIntitule}</div>
          <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 8 }}>
            {p.type === 'PHOTO' ? 'Photo' : p.type === 'DOCUMENT' ? 'Document' : 'Lien'} ajouté(e) par <b>{p.auteur}</b>
          </div>
          {p.type === 'PHOTO' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/pieces-jointes/${p.id}/image`} alt="à valider" style={{ maxWidth: 200, borderRadius: 8, border: '1px solid #ECE5DF', marginBottom: 8 }} />
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => traiter(p.id, 'valider')} disabled={enCours === p.id} style={{ minHeight: 44, padding: '8px 16px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Valider
            </button>
            <button onClick={() => traiter(p.id, 'refuser')} disabled={enCours === p.id} style={{ minHeight: 44, padding: '8px 16px', background: '#fff', color: '#C0461F', border: '1px solid #C0461F', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
