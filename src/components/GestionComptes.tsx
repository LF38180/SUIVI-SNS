'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type CompteVue = { id: number; nom: string; email: string; role: string; actif: boolean }

export function GestionComptes({ comptes }: { comptes: CompteVue[] }) {
  const router = useRouter()
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [role, setRole] = useState('ELU')
  const [msg, setMsg] = useState('')

  async function ajouter() {
    setMsg('')
    try {
      const res = await fetch('/api/comptes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom, email, motDePasse, role }),
      })
      if (res.ok) {
        setNom('')
        setEmail('')
        setMotDePasse('')
        router.refresh()
      } else {
        setMsg((await res.json().catch(() => ({}))).erreur ?? 'Erreur')
      }
    } catch {
      setMsg('Pas de connexion — réessayez.')
    }
  }

  async function basculer(id: number, actif: boolean) {
    setMsg('')
    try {
      const res = await fetch('/api/comptes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, actif: !actif }),
      })
      if (res.ok) router.refresh()
      else setMsg((await res.json().catch(() => ({}))).erreur ?? 'Action impossible.')
    } catch {
      setMsg('Pas de connexion — réessayez.')
    }
  }

  async function reinitMdp(id: number, nom: string) {
    const nouveau = prompt(`Nouveau mot de passe temporaire pour ${nom} :`, 'sns-temp-2026')
    if (!nouveau) return
    const res = await fetch('/api/comptes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, nouveauMotDePasse: nouveau }),
    })
    if (res.ok) alert(`Mot de passe réinitialisé. Communiquez « ${nouveau} » à ${nom} ; il devra le changer.`)
    else alert((await res.json()).erreur ?? 'Erreur')
  }

  async function supprimerRgpd(id: number, nom: string) {
    if (
      !confirm(
        `Supprimer le compte de ${nom} (élu sortant) ?\n\nSes identifiants seront effacés (RGPD). Ses contributions resteront sous « Ancien élu ». Action irréversible.`,
      )
    )
      return
    const res = await fetch('/api/comptes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) router.refresh()
    else alert((await res.json()).erreur ?? 'Erreur')
  }

  const input = { padding: 10, border: '1px solid #ECE5DF', borderRadius: 8, font: 'inherit' as const }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 18 }}>
        <h2>Ajouter un compte</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input placeholder="Nom" value={nom} onChange={(e) => setNom(e.target.value)} style={input} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={input} />
          <input placeholder="Mot de passe temporaire" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} style={input} />
          <select value={role} onChange={(e) => setRole(e.target.value)} style={input}>
            <option value="ELU">Élu</option>
            <option value="ADMIN">Admin</option>
          </select>
          <button onClick={ajouter} className="btn primary">
            Ajouter
          </button>
        </div>
        {msg && <div style={{ marginTop: 8, fontSize: 13, color: '#CD5026' }}>{msg}</div>}
      </div>
      <div className="panel">
        <h2>Comptes existants</h2>
        {comptes.map((c) => (
          <div
            key={c.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 0',
              borderBottom: '1px solid #ECE5DF',
              fontSize: 13,
              opacity: c.actif ? 1 : 0.5,
            }}
          >
            <b style={{ flex: 1 }}>{c.nom}</b>
            <span style={{ color: '#6E6E73' }}>{c.email}</span>
            <span style={{ fontWeight: 600 }}>{c.role}</span>
            <button onClick={() => basculer(c.id, c.actif)} className="btn">
              {c.actif ? 'Désactiver' : 'Activer'}
            </button>
            <button onClick={() => reinitMdp(c.id, c.nom)} className="btn">
              Réinit. mot de passe
            </button>
            <button onClick={() => supprimerRgpd(c.id, c.nom)} className="btn" style={{ color: '#C0461F', borderColor: '#C0461F' }}>
              Supprimer (RGPD)
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
