'use client'
import { useState } from 'react'

export function TogglePartage({ initial }: { initial: boolean }) {
  const [actif, setActif] = useState(initial)
  const [msg, setMsg] = useState('')

  async function basculer() {
    const nouveau = !actif
    setActif(nouveau)
    setMsg('')
    const res = await fetch('/api/parametres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cle: 'partage_public_autorise', valeur: nouveau ? 'oui' : 'non' }),
    })
    if (res.ok) setMsg('Enregistré.')
    else {
      setActif(!nouveau)
      setMsg('Erreur.')
    }
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <h2>Partage public</h2>
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 14, marginTop: 8, cursor: 'pointer' }}>
        <input type="checkbox" checked={actif} onChange={basculer} style={{ width: 20, height: 20 }} />
        Autoriser les boutons de partage (réseaux sociaux) sur la vue publique
      </label>
      <div style={{ fontSize: 12, color: '#6E6E73', marginTop: 6 }}>
        Désactivé par défaut. Si activé, un bouton « Partager » apparaît sur chaque engagement public.
      </div>
      {msg && <div style={{ fontSize: 13, color: msg === 'Enregistré.' ? '#2E6B33' : '#C0461F', marginTop: 8 }}>{msg}</div>}
    </div>
  )
}
