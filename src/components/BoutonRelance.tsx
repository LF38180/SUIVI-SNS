'use client'
import { useState } from 'react'

export function BoutonRelance({ referent, nbMesures }: { referent: string; nbMesures: number }) {
  const [etat, setEtat] = useState<'idle' | 'envoi' | 'fait'>('idle')

  if (referent === 'Sans référent') {
    return <span style={{ fontSize: 12, color: '#9A9AA0' }}>{nbMesures} mesure(s)</span>
  }

  async function relancer() {
    setEtat('envoi')
    const res = await fetch('/api/relancer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referentNom: referent }),
    })
    setEtat(res.ok ? 'fait' : 'idle')
  }

  return (
    <button
      onClick={relancer}
      disabled={etat !== 'idle'}
      className="btn"
      style={{ fontSize: 12, padding: '6px 12px' }}
    >
      {etat === 'fait' ? '✓ Relancé' : etat === 'envoi' ? 'Envoi…' : `Relancer (${nbMesures})`}
    </button>
  )
}
