'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

// Formulaire élu : proposer une INITIATIVE hors programme. La création part en
// validation admin (elle n'apparaît publiquement qu'une fois validée).
export function FormInitiative() {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [intitule, setIntitule] = useState('')
  const [description, setDescription] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function envoyer() {
    if (enCours || !intitule.trim()) return
    setEnCours(true)
    setMsg('')
    setOk(false)
    try {
      const res = await fetch('/api/mesures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intitule, description }),
      })
      if (res.ok) {
        setOk(true)
        setMsg('Proposée ✓ Votre initiative est envoyée pour validation à un administrateur.')
        setIntitule('')
        setDescription('')
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

  const champ = { width: '100%', padding: 12, border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' as const, fontSize: 16, marginTop: 4 }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="btn" style={{ marginTop: 18, minHeight: 48, width: '100%', borderStyle: 'dashed', borderColor: '#C0461F', color: '#C0461F' }}>
        ➕ Proposer une initiative hors programme
      </button>
    )
  }

  return (
    <div className="panel" style={{ marginTop: 18, border: '2px dashed #FCE9E1' }}>
      <h2 style={{ color: '#C0461F', fontSize: 15 }}>Proposer une initiative hors programme</h2>
      <div style={{ fontSize: 13, color: '#6E6E73', marginTop: 4 }}>
        Une action que vous menez et qui n’était pas dans le programme. Elle sera visible une fois validée par un administrateur.
      </div>

      <label htmlFor="init-titre" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6E6E73', marginTop: 14 }}>Intitulé</label>
      <input id="init-titre" value={intitule} onChange={(e) => setIntitule(e.target.value)} placeholder="Ex. : Créer un jardin partagé aux Coteaux" style={champ} />

      <label htmlFor="init-desc" style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6E6E73', marginTop: 14 }}>Description (facultatif)</label>
      <textarea id="init-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="De quoi s’agit-il, pourquoi, où en êtes-vous…" style={champ} />

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        <button onClick={envoyer} disabled={enCours || !intitule.trim()} className="btn primary" style={{ minHeight: 48, opacity: enCours || !intitule.trim() ? 0.6 : 1 }}>
          {enCours ? 'Envoi…' : 'Proposer cette initiative'}
        </button>
        <button onClick={() => setOuvert(false)} className="btn" style={{ minHeight: 48 }}>Annuler</button>
      </div>
      {msg && <div role="status" style={{ marginTop: 10, fontSize: 14, color: ok ? '#2E6B33' : '#C0461F' }}>{msg}</div>}
    </div>
  )
}
