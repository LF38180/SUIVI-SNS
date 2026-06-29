'use client'
import { useState } from 'react'

export function FormMotDePasse() {
  const [ancien, setAncien] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirme, setConfirme] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    setMsg('')
    setOk(false)
    if (nouveau !== confirme) {
      setMsg('Les deux nouveaux mots de passe ne correspondent pas.')
      return
    }
    const res = await fetch('/api/compte/mot-de-passe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ancien, nouveau }),
    })
    if (res.ok) {
      setOk(true)
      setMsg('Mot de passe modifié.')
      setAncien('')
      setNouveau('')
      setConfirme('')
    } else {
      setMsg((await res.json()).erreur ?? 'Erreur')
    }
  }

  const input = { width: '100%', padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' as const, marginTop: 6 }

  return (
    <form className="panel" onSubmit={envoyer}>
      <h2>Changer mon mot de passe</h2>
      <input type="password" placeholder="Mot de passe actuel" value={ancien} onChange={(e) => setAncien(e.target.value)} required autoComplete="current-password" style={input} />
      <input type="password" placeholder="Nouveau mot de passe (8 caractères min.)" value={nouveau} onChange={(e) => setNouveau(e.target.value)} required autoComplete="new-password" style={input} />
      <input type="password" placeholder="Confirmer le nouveau mot de passe" value={confirme} onChange={(e) => setConfirme(e.target.value)} required autoComplete="new-password" style={input} />
      <button type="submit" className="btn primary" style={{ marginTop: 14 }}>
        Modifier
      </button>
      {msg && (
        <div role="status" style={{ marginTop: 10, fontSize: 13, color: ok ? '#3A8540' : '#CD5026' }}>
          {msg}
        </div>
      )}
    </form>
  )
}
