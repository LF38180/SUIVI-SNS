'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Barre } from './Barre'

export function FormProposition({ mesureId, avancementActuel }: { mesureId: number; avancementActuel: number }) {
  const [av, setAv] = useState(avancementActuel)
  const [commentaire, setCommentaire] = useState('')
  const [msg, setMsg] = useState('')
  const router = useRouter()

  async function envoyer() {
    setMsg('')
    const res = await fetch('/api/propositions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesureId, avancementPropose: av, commentaire }),
    })
    if (res.ok) {
      setMsg('Proposition envoyée. En attente de validation par l’administrateur.')
      setCommentaire('')
      router.refresh()
    } else {
      setMsg((await res.json()).erreur ?? 'Erreur')
    }
  }

  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h2>Proposer une mise à jour</h2>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <span>Avancement proposé</span>
        <b>{av}%</b>
      </div>
      <Barre pourcent={av} />
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={av}
        onChange={(e) => setAv(+e.target.value)}
        style={{ width: '100%', accentColor: '#EE6B3E', marginTop: 8, cursor: 'pointer' }}
        aria-label="Avancement proposé"
      />
      <textarea
        placeholder="Commentaire (journal de bord)"
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        rows={3}
        style={{ width: '100%', marginTop: 10, padding: 10, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
      />
      <button onClick={envoyer} className="btn primary" style={{ marginTop: 10 }}>
        Envoyer la proposition
      </button>
      {msg && (
        <div role="status" style={{ marginTop: 10, fontSize: 13, color: '#3A8540' }}>
          {msg}
        </div>
      )}
    </div>
  )
}
