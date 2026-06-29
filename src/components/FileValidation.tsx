'use client'
import { useRouter } from 'next/navigation'

export type PropVue = {
  id: number
  mesureIntitule: string
  auteur: string
  ancien: number
  propose: number
  commentaire: string | null
}

export function FileValidation({ propositions }: { propositions: PropVue[] }) {
  const router = useRouter()

  async function traiter(id: number, action: 'valider' | 'refuser') {
    let motifRefus: string | null = null
    if (action === 'refuser') motifRefus = prompt('Motif du refus (optionnel) :') || null
    const res = await fetch(`/api/propositions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, motifRefus }),
    })
    if (res.ok) router.refresh()
    else alert((await res.json()).erreur ?? 'Erreur')
  }

  if (!propositions.length) {
    return <div style={{ color: '#6E6E73', padding: 40, textAlign: 'center' }}>Aucune proposition en attente.</div>
  }

  return (
    <div>
      {propositions.map((p) => (
        <div key={p.id} className="card">
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.mesureIntitule}</div>
          <div style={{ fontSize: 13, color: '#6E6E73', marginBottom: 6 }}>
            Proposé par <b>{p.auteur}</b> : {p.ancien}% → <b style={{ color: '#EE6B3E' }}>{p.propose}%</b>
          </div>
          {p.commentaire && <div style={{ fontSize: 13, marginBottom: 8 }}>« {p.commentaire} »</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => traiter(p.id, 'valider')}
              style={{ padding: '8px 14px', background: '#3A8540', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Valider
            </button>
            <button
              onClick={() => traiter(p.id, 'refuser')}
              style={{ padding: '8px 14px', background: '#fff', color: '#CD5026', border: '1px solid #CD5026', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
            >
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
