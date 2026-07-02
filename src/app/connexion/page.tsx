'use client'
import { useState } from 'react'

export default function Connexion() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [voirMdp, setVoirMdp] = useState(false)
  const [erreur, setErreur] = useState('')
  const [aide, setAide] = useState(false)
  const [enCours, setEnCours] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (enCours) return
    setErreur('')
    setEnCours(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      })
      if (res.ok) {
        const data = await res.json()
        // Rechargement COMPLET (pas router.push) : la barre de navigation est un
        // Server Component rendu avant connexion ; un simple push ne la régénère pas
        // → on force un vrai chargement pour que les onglets apparaissent tout de suite.
        window.location.href = data.role === 'ADMIN' ? '/admin' : '/mes-mesures'
        return // on garde enCours=true pendant la redirection
      }
      setErreur('Email ou mot de passe incorrect. Vérifiez le message reçu par mail.')
      setEnCours(false)
    } catch {
      setErreur('Pas de connexion internet — vérifiez votre réseau et réessayez.')
      setEnCours(false)
    }
  }

  const champ = { padding: '12px 14px', border: '1px solid #ECE5DF', borderRadius: 10, font: 'inherit' as const, fontSize: 16, width: '100%' }

  return (
    <main style={{ maxWidth: 380, margin: '70px auto', padding: 22 }}>
      <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: '-.5px', lineHeight: 1, marginBottom: 8 }}>
        Seyssins
        <small style={{ display: 'block', fontWeight: 400, fontSize: 14, color: '#6E6E73', marginTop: 2 }}>
          Nature<b style={{ fontWeight: 700, color: '#EE6B3E' }}>&amp;</b>Solidaire
        </small>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: '18px 0' }}>Connexion</h1>
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label htmlFor="email" style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73' }}>
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          style={{ ...champ, marginTop: -6 }}
        />

        <label htmlFor="motdepasse" style={{ fontSize: 13, fontWeight: 600, color: '#6E6E73' }}>
          Mot de passe
        </label>
        <div style={{ position: 'relative', marginTop: -6 }}>
          <input
            id="motdepasse"
            type={voirMdp ? 'text' : 'password'}
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
            required
            autoComplete="current-password"
            style={{ ...champ, paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setVoirMdp((v) => !v)}
            aria-label={voirMdp ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            style={{ position: 'absolute', right: 6, top: 0, height: '100%', width: 38, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
          >
            {voirMdp ? '🙈' : '👁️'}
          </button>
        </div>

        {erreur && (
          <div role="alert" style={{ color: '#C0461F', fontSize: 13 }}>
            {erreur}
          </div>
        )}
        <button type="submit" disabled={enCours} className="btn primary" style={{ padding: 14, fontSize: 15, minHeight: 48, opacity: enCours ? 0.6 : 1 }}>
          {enCours ? 'Connexion en cours…' : 'Se connecter'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setAide((a) => !a)}
        style={{ marginTop: 16, background: 'none', border: 'none', color: '#C0461F', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
      >
        Mot de passe oublié ?
      </button>
      {aide && (
        <div style={{ marginTop: 8, fontSize: 13, color: '#6E6E73', background: '#FAF7F4', borderRadius: 10, padding: '10px 14px' }}>
          Contactez un administrateur du groupe (Loïck Ferrucci ou Julie De Breza) : il pourra
          réinitialiser votre mot de passe et vous en communiquer un nouveau.
        </div>
      )}
    </main>
  )
}
