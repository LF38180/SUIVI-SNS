'use client'
import { useState } from 'react'

// Section repliable (accordéon). Permet de masquer par défaut les détails
// consultatifs (journal, historique, coûts) pour ne pas noyer l'essentiel.
export function Section({ titre, children, ouvertParDefaut = false }: { titre: string; children: React.ReactNode; ouvertParDefaut?: boolean }) {
  const [ouvert, setOuvert] = useState(ouvertParDefaut)
  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <button
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#6E6E73' }}>{titre}</span>
        <span style={{ color: '#C0461F', fontSize: 18 }}>{ouvert ? '−' : '+'}</span>
      </button>
      {ouvert && <div style={{ marginTop: 12 }}>{children}</div>}
    </div>
  )
}
