'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function FormNouvelleMesure() {
  const router = useRouter()
  const [ouvert, setOuvert] = useState(false)
  const [intitule, setIntitule] = useState('')
  const [rubrique, setRubrique] = useState('Initiatives du mandat')
  const [msg, setMsg] = useState('')

  async function creer() {
    setMsg('')
    if (!intitule.trim()) {
      setMsg('Intitulé requis.')
      return
    }
    const res = await fetch('/api/mesures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intitule, rubrique, categorie: 'HORS_PROGRAMME' }),
    })
    const data = await res.json()
    if (res.ok) {
      router.push(`/admin/mesures/${data.id}`)
    } else {
      setMsg(data.erreur ?? 'Erreur')
    }
  }

  const input = { width: '100%', padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const, marginTop: 8 }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="btn primary" style={{ marginBottom: 18 }}>
        + Ajouter une initiative (hors programme)
      </button>
    )
  }

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <h2>Nouvelle initiative hors programme</h2>
      <input placeholder="Intitulé de l'initiative" value={intitule} onChange={(e) => setIntitule(e.target.value)} style={input} />
      <input placeholder="Rubrique (ex: Initiatives du mandat)" value={rubrique} onChange={(e) => setRubrique(e.target.value)} style={input} />
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={creer} className="btn primary">Créer et modifier</button>
        <button onClick={() => setOuvert(false)} className="btn">Annuler</button>
      </div>
      {msg && <div style={{ fontSize: 13, color: '#CD5026', marginTop: 8 }}>{msg}</div>}
    </div>
  )
}
