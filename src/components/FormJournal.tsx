'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Saisie d'une action au journal de bord (reporting). Apparaît immédiatement,
// sans validation admin. Réservé aux élus en charge de la mesure.
export function FormJournal({ mesureId, aujourdhui }: { mesureId: number; aujourdhui: string }) {
  const router = useRouter()
  const [texte, setTexte] = useState('')
  const [date, setDate] = useState(aujourdhui)
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function envoyer() {
    if (enCours || !texte.trim()) return
    setEnCours(true)
    setMsg('')
    setOk(false)
    try {
      const res = await fetch(`/api/mesures/${mesureId}/journal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentaire: texte, date }),
      })
      if (res.ok) {
        setOk(true)
        setMsg('Ajouté ✓')
        setTexte('')
        router.refresh()
      } else {
        setMsg((await res.json().catch(() => ({}))).erreur ?? 'Erreur')
      }
    } catch {
      setMsg('Pas de connexion — réessayez.')
    } finally {
      setEnCours(false)
    }
  }

  const champ = { padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const, fontSize: 16 }

  return (
    <div style={{ background: '#FAF7F4', borderRadius: 10, padding: 12, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73', marginBottom: 8 }}>Noter une action réalisée</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          type="date"
          value={date}
          max={aujourdhui}
          onChange={(e) => setDate(e.target.value)}
          style={{ ...champ, width: 160 }}
          aria-label="Date de l'action"
        />
        <input
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder="Ex. : Réunion avec les services techniques"
          style={{ ...champ, flex: 1, minWidth: 200 }}
          onKeyDown={(e) => { if (e.key === 'Enter') envoyer() }}
        />
        <button onClick={envoyer} disabled={enCours || !texte.trim()} className="btn primary" style={{ minHeight: 44, opacity: enCours || !texte.trim() ? 0.6 : 1 }}>
          {enCours ? '…' : 'Ajouter'}
        </button>
      </div>
      {msg && <div role="status" style={{ marginTop: 8, fontSize: 13, color: ok ? '#2E6B33' : '#C0461F' }}>{msg}</div>}
    </div>
  )
}
