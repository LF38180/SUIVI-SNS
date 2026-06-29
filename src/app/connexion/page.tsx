'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState('')
  const router = useRouter()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErreur('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, motDePasse }),
    })
    if (res.ok) router.push('/')
    else setErreur((await res.json()).erreur ?? 'Erreur')
  }

  return (
    <main style={{ maxWidth: 380, margin: '80px auto', padding: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.5px', lineHeight: 1, marginBottom: 8 }}>
        Seyssins
        <small style={{ display: 'block', fontWeight: 400, fontSize: 14, color: '#6E6E73', marginTop: 2 }}>
          Nature<b style={{ fontWeight: 700, color: '#EE6B3E' }}>&amp;</b>Solidaire
        </small>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '18px 0' }}>Connexion</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          required
          autoComplete="current-password"
          style={{ padding: '11px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' }}
        />
        {erreur && (
          <div role="alert" style={{ color: '#CD5026', fontSize: 13 }}>
            {erreur}
          </div>
        )}
        <button
          type="submit"
          className="btn primary"
          style={{ padding: 12, fontSize: 14 }}
        >
          Se connecter
        </button>
      </form>
    </main>
  )
}
