'use client'
import { useState } from 'react'
import Link from 'next/link'

// Bandeau invitant à changer le mot de passe temporaire. "Plus tard" le masque
// pour la session en cours (il réapparaîtra à la prochaine connexion tant que
// le mot de passe n'est pas changé).
export function BandeauMdp() {
  const [masque, setMasque] = useState(false)
  if (masque) return null
  return (
    <div
      style={{
        background: '#FCE9E1',
        color: '#C0461F',
        padding: '10px 16px',
        fontSize: 14,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}
    >
      <span>🔑 Pensez à choisir votre propre mot de passe.</span>
      <Link href="/compte" className="btn primary" style={{ padding: '6px 14px', fontSize: 13 }}>
        Changer maintenant
      </Link>
      <button onClick={() => setMasque(true)} style={{ background: 'none', border: 'none', color: '#6E6E73', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
        Plus tard
      </button>
    </div>
  )
}
